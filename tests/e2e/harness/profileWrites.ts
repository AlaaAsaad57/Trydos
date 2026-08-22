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
// Two things this got wrong on its first run, both worth keeping written down
//
// **1. Judge the settled answer, not the first one.** `fetchData` recovers from
// a `401` by exchanging the credential and sending the same request again. The
// first answer for a leg is therefore allowed to be a `401` — that is the
// recovery working, not a backend refusing. A judgement on the first write
// reports a healthy save as a broken one. So `outcome()` reads the **last**
// forward write.
//
// **2. Counting writes cannot tell a rollback from a retry.** Both produce two
// writes to the same leg. What separates them is what is *in* them: a forward
// write carries the new value, a rollback carries the old one. So the caller
// passes the value it saved as `marker`, and each write is recorded as carrying
// it or not.
//
// ---------------------------------------------------------------------------
// Nothing is read out of a response body, and nothing is kept out of a request
//
// **The status code is the whole judgement.** An earlier version read
// `success` out of the response, which was meaningless: `success` does not come
// from any backend — `utils/fetchData.ts` stamps it on client-side from the
// HTTP status (line ~650). Reading it proved nothing and put a body that
// carries the account's name, phone and e-mail one careless line away from a
// public job log.
//
// The **request** body is looked at, and only ever reduced to one boolean: does
// it contain the marker. The body itself is never stored and never returned.

import type { Page } from "@playwright/test";

import { fromServiceToken } from "utils/serviceTokens";

/** The backends that keep their own copy of a shopper's details. */
export type ProfileLeg = "core" | "stories" | "chat";

/** In the order `UpdateProfile` writes them. */
export const PROFILE_LEGS: readonly ProfileLeg[] = ["stories", "chat", "core"];

/** One write to one leg. Both fields are safe to print. */
export type LegWrite = {
  /** The status the backend answered with. */
  status: number;
  /** Did this write carry the new value, or the old one being put back? */
  forward: boolean;
};

/** What became of one leg of the save. */
export type LegOutcome = {
  /** Was this backend asked to store the new value at all? */
  asked: boolean;
  /** The status of its **last** answer to a forward write. `null` if never
   *  asked. Last, not first: a `401` that the app then recovers from is the
   *  recovery working. */
  status: number | null;
  /** Did that settled answer accept it? */
  accepted: boolean;
  /** Did a write carrying the **old** value follow — the rollback
   *  `UpdateProfile` sends when a later leg failed? A leg written and then put
   *  back is a partial success, which is a failure. */
  rolledBack: boolean;
  /** How many times the forward write had to be sent. More than one means the
   *  credential was refused and exchanged mid-save. Not a failure — worth
   *  saying in a message. */
  attempts: number;
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
  rolledBack: false,
  attempts: 0,
};

/** Start recording. Attach this **before** the save is triggered.
 *
 *  `marker` is the value being saved. It is used for one thing only: deciding,
 *  per request, whether that request carried the new value or the old one. */
export const recordProfileWrites = (
  page: Page,
  options: { marker: string },
): ProfileWriteRecorder => {
  const seen: Record<ProfileLeg, LegWrite[]> = {
    core: [],
    stories: [],
    chat: [],
  };
  const waiting = new Set<() => void>();

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

    // Reduced to a boolean here and nowhere else. The body is not stored.
    let forward = false;
    try {
      forward = (request.postData() ?? "").includes(options.marker);
    } catch {
      // A body this cannot read is recorded as not-forward, which reads as
      // "never asked" rather than as a pass. Fail closed.
    }

    seen[leg].push({ status: response.status(), forward });
    for (const wake of waiting) wake();
  });

  const forwardWrites = (leg: ProfileLeg): LegWrite[] =>
    seen[leg].filter((write) => write.forward);

  const waitForWrite = (leg: ProfileLeg, timeoutMs: number): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      if (forwardWrites(leg).length > 0) {
        resolve(true);
        return;
      }

      let timer: ReturnType<typeof setTimeout> | undefined;

      const wake = () => {
        if (forwardWrites(leg).length === 0) return;
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
    const forward = forwardWrites(leg);
    if (forward.length === 0) return NOT_ASKED;

    // The last one: everything before it was retried, so it is not the answer.
    const settled = forward[forward.length - 1];

    return {
      asked: true,
      status: settled.status,
      accepted: settled.status < 400,
      // A write carrying the old value only ever comes from the rollback in
      // `UpdateProfile`'s catch.
      rolledBack: seen[leg].some((write) => !write.forward),
      attempts: forward.length,
    };
  };

  return {
    waitForWrite,
    outcome,
    reset: () => {
      seen.core = [];
      seen.stories = [];
      seen.chat = [];
    },
  };
};
