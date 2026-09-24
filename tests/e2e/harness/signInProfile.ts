// What a **fresh sign-in** says the backends are holding for this account.
//
// `harness/profileWrites.ts` watches a save go out and judges the status each
// backend answered with. That proves the write was accepted. It does not prove
// the backend kept it — an accepted write and a stored value are two different
// facts, and only the second one is what a shopper sees when they come back.
//
// The reload the profile cases do afterwards does not close that gap either:
// `/api/auth/me` reads cookies only, and the settings screens render from the
// same cookie the save wrote. A reload therefore shows the **app's own copy**,
// which the app wrote from its own request body. It is a real check — it caught
// the missing `gender`/`email`/`alternative_phone` mirror — but it is a check of
// the app, not of any backend.
//
// Signing out and signing back in is the missing second opinion. Every cookie
// is thrown away, and `/api/auth/login` fills them again from what three
// backends answer with. So this module records that one answer and asks it the
// only question that matters: **is the value that was saved the value that came
// back?**
//
// ---------------------------------------------------------------------------
// Which legs of that answer are real proof, and which one is not
//
// `app/api/auth/login/route.ts` does four things at once, and they do not all
// count the same:
//
//   * **core** — `data.user` is the record the core backend answered the OTP
//     verification with. Nothing in the request told it what to say. Both the
//     name and the picture are proof.
//
//   * **stories** — `StoriesUser` is the stories login answer, and that request
//     carries `{ otp_id_token, mobile_phone, original_user_id }` only. No name,
//     no picture. Both fields are proof.
//
//   * **chat** — the chat login request carries `name: String(name ||
//     InventoryUser.name)`, so on paper the name chat answers with could be
//     nothing more than the core name it was just handed. **It is not**, and
//     that was measured rather than assumed: on a run whose login request
//     carried the new probe name, chat answered with the account's older stored
//     name instead. Chat answers from its own record, so its name is proof like
//     the other two. The picture is proof for all three — no login request
//     carries one.
//
// ---------------------------------------------------------------------------
// The two names for one picture
//
// The same picture is stored under two shapes, by `ConfigurePhoto` in
// `services/auth.ts`:
//
//     core             "1712345678-abc.png"
//     stories / chat   "/customers/profile/1712345678-abc.png"
//
// So an exact comparison would report the core leg and the other two as
// disagreeing when they hold the same file. The file name is the part they
// share, and that is what the picture is matched on.
//
// ---------------------------------------------------------------------------
// Nothing out of the body survives this module
//
// The sign-in answer carries the account's name, phone, e-mail and id. The rule
// `harness/profileWrites.ts` set still holds: the comparison happens **inside**
// the listener and only a small enum comes out. The body is never stored, never
// returned and never printed, so no assertion message built from a reading can
// publish an account detail into a public job log.
//
// The two expected values the caller passes in are its own — the probe name it
// chose, and the file name it read back after its own upload. Neither is
// asserted on directly, for the same reason `profile.live.spec.ts` holds the
// account's real name in a variable and never prints it.
//
// The one thing that does come out is a **row id**, and it comes out because it
// is the finding — see `harness/updateAnswer.ts`.

import type { Page, Response } from "@playwright/test";

/** The backends whose stored copy a sign-in answer carries. */
export type SignInProfileLeg = "core" | "stories" | "chat";

/** In the order the login route collects them. */
export const SIGN_IN_PROFILE_LEGS: readonly SignInProfileLeg[] = [
  "core",
  "stories",
  "chat",
];

/** What one field of one backend's copy turned out to be.
 *
 *  Six outcomes, because a reader needs a different next move for each — and
 *  the difference between the middle two is the one that matters most:
 *
 *    `absent`  the answer has **no such field**. The backend did not lose the
 *              value; it never offers this field on a sign-in at all, so this
 *              leg cannot be judged from here. That is a gap in the test, or a
 *              backend that changed its answer's shape.
 *    `empty`   the field **is** there and carries nothing. The backend really
 *              did lose the value.
 *
 *  Telling those two apart is the whole reason `LegReading.keys` exists. */
export type FieldReading =
  | "matches"
  | "differs"
  | "empty"
  | "absent"
  | "no user"
  | "not read";

/** One backend's copy, as the sign-in answer described it. */
export type LegReading = {
  /** The stored name against the name the case saved. */
  name: FieldReading;
  /** The stored picture against the file the case uploaded. */
  picture: FieldReading;
  /** The **names** of the fields this backend's answer carried, sorted.
   *
   *  Names only, never values — that is what makes them safe to print, and
   *  printing them is the point: an `absent` reading is unreadable without
   *  them. "the stories backend offers no name" leaves a reader guessing; "it
   *  answered with id, access_token, refresh_token" tells them at once that the
   *  sign-in reply is a credential, not a profile. */
  keys: readonly string[];
  /** The `id` this backend answered with, as text. `null` if it sent none.
   *
   *  Here because of what it found. The row a save writes and the row a sign-in
   *  reads are **not the same row** for stories and chat — 452 against 453, and
   *  652 against 657, on one account in one run. A failure that says "the name
   *  is gone" sends a reader looking for lost data; a failure that says "it was
   *  stored in row 452 and read back from row 453" hands them the fault.
   *
   *  An id, not an account detail: the login route already returns
   *  `original_user_id` to the browser, and `actions/auth.ts` reads the account
   *  id back and asserts on it. */
  row: string | null;
};

export type SignInProfileRecorder = {
  /** Resolve once a sign-in answer has been read, or `false` on timeout.
   *
   *  Fails closed: an answer never seen, or one whose body could not be parsed,
   *  is `false`. */
  waitForSignIn: (timeoutMs: number) => Promise<boolean>;
  /** What that answer said this backend is holding. */
  reading: (leg: SignInProfileLeg) => LegReading;
};

/** The address the widget signs in through (`services/auth.ts`, `VerifyOtp`).
 *
 *  Called directly rather than through `/api/proxy`: `fetchData` treats
 *  `server: "local"` as "this app's own route", so there is no proxy header to
 *  read here and the path is the whole of the match. */
const LOGIN_PATH = "/api/auth/login";

const isSignInAnswer = (response: Response): boolean => {
  try {
    return new URL(response.url()).pathname === LOGIN_PATH;
  } catch {
    return false;
  }
};

/** The row this answer describes, as text.
 *
 *  Text because the two backends disagree about the type — chat sends a string
 *  and stories sends a number — and a comparison that cared about the type
 *  would report two readings of the same row as different. */
const rowOf = (record: Record<string, unknown>): string | null => {
  const id = record["id"];
  return id === null || id === undefined ? null : String(id);
};

/** Nothing was read for this leg. Not a pass and not a failure — a caller that
 *  gets this has to report that its own recording never happened. */
const NOTHING_READ: LegReading = {
  name: "not read",
  picture: "not read",
  row: null,
  keys: [],
};

/** How one field is judged.
 *
 *  `exact` for the name. `contains` for the picture, because the same file is
 *  stored as a bare name by the core backend and under `/customers/profile/` by
 *  the other two — see the header. */
type Match = "exact" | "contains";

const readField = (
  record: Record<string, unknown>,
  key: string,
  expected: string | null,
  how: Match,
): FieldReading => {
  if (expected === null) return "not read";
  // Asked of the object, not of the value: a key that is missing and a key set
  // to "" mean different things, and only this can tell them apart.
  if (!(key in record)) return "absent";

  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") return "empty";
  return (how === "exact" ? value.trim() === expected : value.includes(expected))
    ? "matches"
    : "differs";
};

/** Reduce one backend's user object to two readings and its field names, then
 *  drop it.
 *
 *  This function is the boundary the header describes: an object carrying the
 *  account's details goes in; two enum values and a list of key names come
 *  out. */
const readLeg = (
  user: unknown,
  expected: { name: string | null; picture: string | null },
  keys: { name: string; picture: string },
): LegReading => {
  if (!user || typeof user !== "object") {
    return { ...NOTHING_READ, name: "no user", picture: "no user" };
  }
  const record = user as Record<string, unknown>;
  return {
    name: readField(record, keys.name, expected.name, "exact"),
    picture: readField(record, keys.picture, expected.picture, "contains"),
    row: rowOf(record),
    // Names only. Nothing here is a value out of the body.
    keys: Object.keys(record).sort(),
  };
};

/** Start listening for a sign-in answer. Attach this **before** signing in.
 *
 *  `expected.name` is the name the case saved; `expected.picture` is the file
 *  name of the picture it uploaded. Either may be `null`, which means "this case
 *  is not judging that field" and makes every reading for it `"not read"`. */
export const recordSignInProfile = (
  page: Page,
  expected: { name: string | null; picture: string | null },
): SignInProfileRecorder => {
  let readings: Record<SignInProfileLeg, LegReading> = {
    core: NOTHING_READ,
    stories: NOTHING_READ,
    chat: NOTHING_READ,
  };
  let read = false;
  const waiting = new Set<() => void>();

  page.on("response", (response) => {
    if (!isSignInAnswer(response)) return;

    // The only place the body exists. `readLeg` turns it into enums and this
    // scope ends; nothing below the `then` can reach it.
    void response
      .json()
      .then((body) => {
        readings = {
          core: readLeg(body?.data?.user, expected, {
            name: "name",
            picture: "image",
          }),
          stories: readLeg(body?.StoriesUser, expected, {
            name: "name",
            picture: "photo_path",
          }),
          chat: readLeg(body?.ChatUser, expected, {
            name: "name",
            picture: "photo_path",
          }),
        };
        read = true;
        for (const wake of waiting) wake();
      })
      .catch(() => {
        // Swallowed on purpose, and it is not a silent pass: `read` stays
        // false, so `waitForSignIn` times out and the caller reports that the
        // answer was never read. A throw here would land in a listener nothing
        // awaits, where it becomes an unhandled rejection with the body it
        // choked on attached — which is the one thing this module must not let
        // out.
      });
  });

  const waitForSignIn = (timeoutMs: number): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      if (read) {
        resolve(true);
        return;
      }

      let timer: ReturnType<typeof setTimeout> | undefined;

      const wake = () => {
        if (!read) return;
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
    waitForSignIn,
    reading: (leg: SignInProfileLeg): LegReading => readings[leg],
  };
};
