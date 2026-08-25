// Watching what a profile save actually wrote, one backend at a time.
//
// `AuthService.UpdateProfile` fans a single "Save" out to three backends, in
// this order: **stories**, then **chat**, then the **core** backend. Each keeps
// its own copy of the shopper's name, phone and picture. A save can therefore
// finish with two of the three written and the third refused, and the only
// thing that says so is the traffic — so this records it.
//
// **The wallet is deliberately not one of the three.** Its leg is commented out
// in `services/auth.ts` and `wallet_done` stays `false`, which also makes its
// rollback inert. Three legs is correct, not an omission. If that block is ever
// re-enabled, this file gains a fourth leg in the same change.
//
// ---------------------------------------------------------------------------
// One interception point covers all of it
//
// Every client-side call to a backend goes through `utils/fetchData.ts`, which
// POSTs to `/api/proxy` and puts the real target in `x-proxy-url`, the real verb
// in `x-proxy-method`, and the service as an opaque token in `x-proxy-server`.
// So one listener sees every leg, and the headers say which leg it is looking
// at. `fromServiceToken` turns the token back into a name.
//
// ---------------------------------------------------------------------------
// Judge the settled answer, not the first one
//
// `fetchData` recovers from a `401` by exchanging the credential and sending the
// same request again. The first answer for a leg is therefore allowed to be a
// `401` — that is the recovery working, not a backend refusing. A judgement on
// the first write reports a healthy save as a broken one, which is exactly what
// the first run of `profile.live.spec.ts` did. So `outcome()` reads the **last**
// write and reports how many attempts it took as context.
//
// ---------------------------------------------------------------------------
// This does not try to spot the rollback, and it does not need to
//
// An earlier version compared each write against the value being saved, to tell
// a forward write from the rollback `UpdateProfile` sends when a later leg
// fails. Two problems: counting writes cannot do it (a `401` retry also
// produces two), and matching the value only works for a **name** change — a
// size or gender save sends stories and chat the same unchanged name either
// way, so forward and rollback bodies are identical.
//
// It is also unnecessary. `UpdateProfile`'s catch rethrows after rolling back,
// so `updateUserProfile` never navigates when a rollback happened. **A save
// that completed is a save that did not roll back**, and the spec already
// asserts the completion. One fact, asserted once, instead of a mechanism that
// only worked for one field.
//
// ---------------------------------------------------------------------------
// Nothing is read out of a response body, and nothing is **kept** out of a
// request
//
// **The status code is the whole judgement.** An earlier version read
// `success` out of the response, which was meaningless: `success` does not come
// from any backend — `utils/fetchData.ts` stamps it on client-side from the
// HTTP status (line ~650). Reading it proved nothing and put a body that
// carries the account's name, phone and e-mail one careless line away from a
// public job log. That still holds: no response body is read.
//
// A request body **is** looked at now, and this is the rule that keeps it safe:
// the comparison happens inside the listener and only a **boolean** comes out.
// The body is never stored, never returned and never printed. `carriedExpected`
// is the whole of what survives it.
//
// It exists because one criterion needs it: when the credential is refused
// mid-save the app retries the same leg, and a retry looks exactly like the
// rollback in every other respect. What separates them is which value the second
// write carried. Counting cannot do it — a `401` retry produces two writes just
// as a rollback does.
//
// **It only works for a name.** For a size or a gender the rollback body and the
// forward body are identical, so the comparison would report `true` either way.
// The caller passes the value it is saving, and the case that uses this makes
// that value unique to the run.

import type { Page } from "@playwright/test";

import { fromServiceToken } from "utils/serviceTokens";

/** The backends that keep their own copy of a shopper's details. */
export type ProfileLeg = "core" | "stories" | "chat";

/** In the order `UpdateProfile` writes them. */
export const PROFILE_LEGS: readonly ProfileLeg[] = ["stories", "chat", "core"];

/** One write to one leg. Safe to print — both fields are facts about the write,
 *  not values out of it. */
export type LegWrite = {
  /** The status the backend answered with. */
  status: number;
  /** Did this write carry the value the caller said it was saving?
   *
   *  `false` when no expected value was given, so it is only meaningful to a
   *  caller that asked for it. */
  carriedExpected: boolean;
};

/** What became of one leg of the save. */
export type LegOutcome = {
  /** Was this backend asked to store the new value at all?
   *
   *  Read from the **request**, not the answer. A write that is sent and then
   *  aborted never produces a response, and judging on responses alone would
   *  report such a leg as "never asked" — which is the opposite of the truth,
   *  and exactly the reading a case proving absence must not get. */
  asked: boolean;
  /** The status of its **last** answer to a forward write. `null` if never
   *  asked. Last, not first: a `401` that the app then recovers from is the
   *  recovery working. */
  status: number | null;
  /** Did that settled answer accept it? */
  accepted: boolean;
  /** How many times the write had to be sent. More than one means the
   *  credential was refused and exchanged mid-save. Not a failure — worth
   *  saying in a message. */
  attempts: number;
  /** Did the **settled** write carry the value being saved?
   *
   *  This is what tells a retry from a rollback: the retry carries the new
   *  value, the rollback carries the old one. Only meaningful when the caller
   *  passed an expected value, and only for a field whose two bodies differ —
   *  see the header. */
  carriedExpected: boolean;
};

export type ProfileWriteRecorder = {
  /** Resolve once this leg has been asked to store the new value, or `false` on
   *  timeout. Fails closed: a leg never seen is `false`. */
  waitForWrite: (leg: ProfileLeg, timeoutMs: number) => Promise<boolean>;
  outcome: (leg: ProfileLeg) => LegOutcome;
  /** Forget everything, so one page can record a second save. */
  reset: () => void;
};

/** Which leg a proxied request belongs to, or `null` for the ordinary traffic
 *  the page makes alongside it.
 *
 *  Stories and chat both live under `/api/v1/users/`, so the service name is
 *  what tells them apart, and the verb is what separates the chat update from a
 *  chat read of the same path. */
const legOf = (
  server: string,
  target: string,
  method: string,
): ProfileLeg | null => {
  if (server === "market" && target.includes("/customer/update-profile")) {
    return "core";
  }
  if (server === "stories" && target.includes("/api/v1/users/update")) {
    return "stories";
  }
  if (
    server === "chat" &&
    method === "PUT" &&
    target.includes("/api/v1/users/")
  ) {
    return "chat";
  }
  return null;
};

const NOT_ASKED: LegOutcome = {
  asked: false,
  status: null,
  accepted: false,
  attempts: 0,
  carriedExpected: false,
};

/** Start recording. Attach this **before** the save is triggered.
 *
 *  `expected` is the value the caller is about to save. Give it only when the
 *  case needs `carriedExpected`, and only for a name — see the header. */
export const recordProfileWrites = (
  page: Page,
  options: { expected?: string } = {},
): ProfileWriteRecorder => {
  const seen: Record<ProfileLeg, LegWrite[]> = {
    core: [],
    stories: [],
    chat: [],
  };
  // Kept apart from `seen` on purpose. Feeding request events into the same
  // list would count every healthy write twice — which is the signal that
  // means "the credential was exchanged mid-save" — and would leave the last
  // entry with no status, making a successful leg read as refused.
  const asked = new Set<ProfileLeg>();
  const waiting = new Set<() => void>();

  page.on("request", (request) => {
    if (!request.url().includes("/api/proxy")) return;
    const headers = request.headers();
    const leg = legOf(
      fromServiceToken(headers["x-proxy-server"] ?? ""),
      headers["x-proxy-url"] ?? "",
      (headers["x-proxy-method"] ?? "").toUpperCase(),
    );
    if (leg) asked.add(leg);
  });

  page.on("response", (response) => {
    const request = response.request();
    if (!request.url().includes("/api/proxy")) return;

    const headers = request.headers();
    // `x-proxy-url` is `encodeURI`d, which leaves "/" alone, so the substrings
    // matched below need no decoding — and decoding could throw inside a
    // listener nothing awaits.
    const leg = legOf(
      fromServiceToken(headers["x-proxy-server"] ?? ""),
      headers["x-proxy-url"] ?? "",
      (headers["x-proxy-method"] ?? "").toUpperCase(),
    );
    if (!leg) return;

    // Only now, and only to a boolean. `postData()` carries the account's name,
    // phone and e-mail; nothing below keeps any of it.
    let carriedExpected = false;
    if (options.expected !== undefined) {
      try {
        carriedExpected = (request.postData() ?? "").includes(options.expected);
      } catch {
        // A body that cannot be read is not a body that carried the value.
      }
    }

    seen[leg].push({ status: response.status(), carriedExpected });
    for (const wake of waiting) wake();
  });

  const waitForWrite = (leg: ProfileLeg, timeoutMs: number): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      if (seen[leg].length > 0) {
        resolve(true);
        return;
      }

      let timer: ReturnType<typeof setTimeout> | undefined;

      const wake = () => {
        if (seen[leg].length === 0) return;
        clearTimeout(timer);
        waiting.delete(wake);
        resolve(true);
      };

      timer = setTimeout(() => {
        waiting.delete(wake);
        resolve(false);
      }, timeoutMs);

      waiting.add(wake);
    });

  const outcome = (leg: ProfileLeg): LegOutcome => {
    const writes = seen[leg];
    if (writes.length === 0) {
      // Sent but never answered still counts as asked — see `LegOutcome.asked`.
      return asked.has(leg) ? { ...NOT_ASKED, asked: true } : NOT_ASKED;
    }

    // The last one: everything before it was retried, so it is not the answer.
    const settled = writes[writes.length - 1];

    return {
      asked: true,
      status: settled.status,
      accepted: settled.status < 400,
      attempts: writes.length,
      carriedExpected: settled.carriedExpected,
    };
  };

  return {
    waitForWrite,
    outcome,
    reset: () => {
      seen.core = [];
      seen.stories = [];
      seen.chat = [];
      // Both stores, or a second measured save inherits the first one's answer
      // to "was this leg asked" — which is the one question absence turns on.
      asked.clear();
    },
  };
};
