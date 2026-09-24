// What stories and chat answer the profile **update** with — which is the row
// they wrote it into.
//
// `harness/profileWrites.ts` judges the status of each leg of a save and reads
// no body at all. `harness/signInProfile.ts` reads the sign-in answer. This
// module sits between them, and it exists because of a question neither could
// settle on its own — and because the answer turned out to be a defect.
//
// ---------------------------------------------------------------------------
// The question
//
// PROF-08 signs out, signs back in, and reads what each backend answers with.
// The core backend answers with this run's name and this run's picture. Stories
// and chat do not.
//
// A missing value there has two readings, and they lead opposite ways:
//
//   1. The backend accepted the update and did not keep it.
//   2. The backend kept it, and its *sign-in* answer is a credential rather
//      than a profile, so it never carried the value at all. Then the fault is
//      in the test, and asserting on it would name an innocent backend.
//
// ---------------------------------------------------------------------------
// Neither. The write and the read land on different rows
//
// Measured on one account (core user 18081) in one run:
//
//     leg      update answer                    sign-in answer
//     stories  id 452, the new name             id 453, name null
//     chat     id 652, the new name             id 657, the account's OLD name
//
// Both backends took the change, at 200, with the new name and the new
// `photo_path` echoed back. Then the sign-in answered from a **different row**.
// Chat's is the line that rules out reading 2: row 657 carries a real name, and
// it is the account's older one — not null, and not the new name the login
// request itself handed it. It is a stored record; it is simply not the record
// the save wrote.
//
// So the shopper renames themselves, signs out, signs back in, and chat is
// holding their old name and no picture. That is the finding PROF-08 reports,
// and this module supplies half of the evidence for it — the row the save
// reached, which is the half a sign-in answer can never show.
//
// ---------------------------------------------------------------------------
// Same rule as the other two recorders
//
// The update answer carries the account's name and phone. The comparison
// happens inside the listener; what comes out is two enum values, a status and
// a row id. No value from any body leaves this module.

import type { Page } from "@playwright/test";

import { fromServiceToken } from "utils/serviceTokens";

/** The two backends whose sign-in answer could not settle the question.
 *
 *  The core backend is not here: its sign-in answer already carries this run's
 *  values, so there is nothing left to ask it. */
export type UpdateLeg = "stories" | "chat";

export const UPDATE_LEGS: readonly UpdateLeg[] = ["stories", "chat"];

/** What the update answer said about one field.
 *
 *  `absent` and `empty` are kept apart for the same reason
 *  `harness/signInProfile.ts` keeps them apart: a field the backend does not
 *  send and a field it sends blank are different faults with different next
 *  moves. */
export type EchoReading =
  | "matches"
  | "differs"
  | "empty"
  | "absent"
  | "no answer";

/** One backend's answer to the update, reduced. */
export type UpdateReading = {
  /** The status it answered with. `null` if it never answered. */
  status: number | null;
  /** Does the answer echo the name that was just saved? */
  name: EchoReading;
  /** Does the answer carry a picture at all?
   *
   *  `matches` here means "filled", not "is this exact file" — and that is a
   *  deliberate limit, not an oversight. The file name is minted by the media
   *  store *during* the save, so the case cannot know it before the answer
   *  arrives, and retaining the value to compare later is what this module
   *  refuses to do. What makes "filled" mean something is PROF-08's own
   *  pre-condition: it asserts the account starts with **no** picture, so a
   *  filled `photo_path` in this answer is a value that did not exist before
   *  this run. */
  picture: EchoReading;
  /** Note: no list of field names is exposed. An earlier version returned one
   *  to tell "the backend sent no such field" from "the backend sent it blank",
   *  which is the distinction `harness/signInProfile.ts` still needs. Here it
   *  answered its question — both backends echo the whole row — and nothing
   *  asserts on it any more, so it is gone rather than kept as decoration. */
  /** The `id` the answer carried, as text — the row the save actually reached.
   *
   *  Text because chat sends a string and stories sends a number. Compared
   *  against `LegReading.row` from the sign-in answer, this is the finding. */
  row: string | null;
};

const NO_ANSWER: UpdateReading = {
  status: null,
  name: "no answer",
  picture: "no answer",
  row: null,
};

export type UpdateAnswerRecorder = {
  /** Resolve once this leg has answered, or `false` on timeout. */
  waitForAnswer: (leg: UpdateLeg, timeoutMs: number) => Promise<boolean>;
  reading: (leg: UpdateLeg) => UpdateReading;
};

/** Which leg a proxied request belongs to.
 *
 *  The same rule `harness/profileWrites.ts` uses, and only the two legs this
 *  module asks about. Stories and chat both live under `/api/v1/users/`, so the
 *  service name tells them apart and the verb separates the chat update from a
 *  chat read of the same path. */
const legOf = (
  server: string,
  target: string,
  method: string,
): UpdateLeg | null => {
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

const hasSomethingIn = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

/** Walk the whole answer and collect field names, never values.
 *
 *  Recursive because the wrapping differs per backend — see `keys`. The depth
 *  cap is not tidiness: a body with a cycle in it would otherwise hang a
 *  listener nothing awaits. */
const collect = (
  value: unknown,
  keys: Set<string>,
  filled: Set<string>,
  depth = 0,
): void => {
  if (depth > 6 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 20)) collect(item, keys, filled, depth + 1);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    if (hasSomethingIn(child)) filled.add(key);
    collect(child, keys, filled, depth + 1);
  }
};

/** Does the answer, anywhere in it, carry this value?
 *
 *  Asked of the serialised body and answered with an enum. `absent` means the
 *  field name is nowhere in the answer, so there was nothing to echo; `empty`
 *  means the field is there and blank; `differs` means the answer carries that
 *  field with something else in it.
 *
 *  `expected` of `null` asks the weaker question — "is there anything in this
 *  field at all" — and that is what the picture is judged on. See
 *  `UpdateReading.picture` for why it cannot be judged on the exact file. */
const echoOf = (
  body: string,
  keys: Set<string>,
  filled: Set<string>,
  field: string,
  expected: string | null,
): EchoReading => {
  if (!keys.has(field)) return "absent";
  if (!filled.has(field)) return "empty";
  if (expected === null) return "matches";
  return body.includes(expected) ? "matches" : "differs";
};

/** The row the answer describes.
 *
 *  Read off the raw body rather than the collected names, because the id sits
 *  inside the wrapper these backends use and only the first one is the row. */
const rowOf = (body: string): string | null => {
  let found: unknown;
  const walk = (value: unknown, depth = 0): void => {
    if (depth > 6 || !value || typeof value !== "object" || found !== undefined) {
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (key === "id" && found === undefined) found = child;
      walk(child, depth + 1);
    }
  };
  try {
    walk(JSON.parse(body));
  } catch {
    // Not JSON — no row to name.
  }
  return found === null || found === undefined ? null : String(found);
};

/** Start recording. Attach this **before** the save is triggered. */
export const recordUpdateAnswers = (
  page: Page,
  expected: { name: string | null },
): UpdateAnswerRecorder => {
  const seen: Record<UpdateLeg, UpdateReading> = {
    stories: NO_ANSWER,
    chat: NO_ANSWER,
  };
  const answered = new Set<UpdateLeg>();
  const waiting = new Set<() => void>();

  page.on("response", (response) => {
    const request = response.request();
    if (!request.url().includes("/api/proxy")) return;

    const headers = request.headers();
    const leg = legOf(
      fromServiceToken(headers["x-proxy-server"] ?? ""),
      headers["x-proxy-url"] ?? "",
      (headers["x-proxy-method"] ?? "").toUpperCase(),
    );
    if (!leg) return;

    const status = response.status();

    void response
      .text()
      .then((body) => {
        const keys = new Set<string>();
        const filled = new Set<string>();
        try {
          collect(JSON.parse(body), keys, filled);
        } catch {
          // An answer that is not JSON carries no field names. The status and
          // the readings below still say what happened.
        }

        seen[leg] = {
          status,
          // `photo_path` for both: that is what `UpdateProfile` sends them.
          name: echoOf(body, keys, filled, "name", expected.name),
          picture: echoOf(body, keys, filled, "photo_path", null),
          row: rowOf(body),
        };
        answered.add(leg);
        for (const wake of waiting) wake();
      })
      .catch(() => {
        // Swallowed on purpose, and not a silent pass: the leg stays out of
        // `answered`, so `waitForAnswer` times out and the caller reports it.
        // A throw here lands in a listener nothing awaits, where it becomes an
        // unhandled rejection carrying the body it choked on.
      });
  });

  const waitForAnswer = (leg: UpdateLeg, timeoutMs: number): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      if (answered.has(leg)) {
        resolve(true);
        return;
      }

      let timer: ReturnType<typeof setTimeout> | undefined;

      const wake = () => {
        if (!answered.has(leg)) return;
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

  return {
    waitForAnswer,
    reading: (leg: UpdateLeg): UpdateReading => seen[leg],
  };
};
