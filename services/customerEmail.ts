import { parseFieldErrors } from "utils/fieldErrors";

/**
 * Reads the answers of the customer email code endpoints (core backend):
 *
 *   POST /customer/email/send-otp    { email }        -> a 6-digit code by email
 *   POST /customer/email/verify-otp  { email, code }  -> the email is saved, verified
 *
 * Contract: customer-email-otp-frontend-guide.md (backend PRs #697, #698, #699).
 *
 * The functions here only read an answer that `fetchData` already returned
 * (`{ ...body, success, httpStatus }`). They do not send anything, so the
 * unit suite can check every answer without a network stand-in.
 *
 * The rule of the contract: choose what to show by the HTTP status. The
 * backend's `message` is English text for developers, so it never reaches
 * the screen.
 */

/** What went wrong, in the words the screen needs. */
export type EmailCodeProblem =
  /** 422 with `data.attempts_left` above 0: try again. */
  | "wrong-code"
  /** 422 with `data.attempts_left` at 0: this code is dead. */
  | "no-tries-left"
  /** 410: the code is older than 10 minutes. */
  | "expired"
  /** 404: no code waits for this email (used, replaced, or killed). */
  | "no-code"
  /** 409: another account has this email. */
  | "in-use"
  /** 409 on an email that is already this account's verified email. */
  | "already-verified"
  /** 403: a guest account. */
  | "guest"
  /** 429 in the usual format: a new code was asked too soon. */
  | "too-soon"
  /** 429 in Laravel's own format: more than 10 calls a minute. */
  | "rate-limited"
  /** Anything else: 401 after the re-auth gave up, 422 validation, 5xx, network. */
  | "failed";

export type SendEmailCodeResult =
  | {
      ok: true;
      /** The address the code went to, as the backend saved it (trimmed, lowercase). */
      email: string;
      /** When the code stops working (UTC ISO 8601). */
      expiresAt: string | null;
      /** How long "resend" waits, in seconds. */
      resendAfterSeconds: number;
    }
  | {
      ok: false;
      problem: EmailCodeProblem;
      /** For "too-soon" and "rate-limited": how long to wait, in seconds. */
      retryAfterSeconds?: number;
    };

export type VerifyEmailCodeResult =
  | { ok: true; user: Record<string, any> }
  | {
      ok: false;
      problem: EmailCodeProblem;
      /** For "wrong-code": the tries this code has left. */
      attemptsLeft?: number;
    };

/**
 * The resend wait when an answer carries none. The backend sets the real value
 * (120 s today) and every answer is read for it first; this is only the floor
 * for an answer that lost it. The Laravel 429 carries its wait in the
 * `Retry-After` header, and `fetchData` does not hand headers back, so a
 * rate-limit answer uses this value too.
 */
export const FALLBACK_WAIT_SECONDS = 60;

/** The backend saves the email trimmed and in lowercase. Send it the same way. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const seconds = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.ceil(n) : undefined;
};

/**
 * The 429 of the request limit is Laravel's own body (`{ message }` only).
 * The resend-wait 429 is the usual body, with `isSuccessful`.
 */
const isUsualBody = (answer: any) =>
  answer && typeof answer === "object" && "isSuccessful" in answer;

/** The answer of the code request. `current`: the account's email now, and whether it is verified. */
export function readSendAnswer(
  answer: any,
  requested: string,
  current?: { email?: string | null; verified?: boolean },
): SendEmailCodeResult {
  const status = Number(answer?.httpStatus);
  if (answer?.success && status === 200) {
    return {
      ok: true,
      email: String(answer?.data?.email || normalizeEmail(requested)),
      expiresAt: answer?.data?.expires_at ?? null,
      resendAfterSeconds:
        seconds(answer?.data?.resend_after_seconds) ?? FALLBACK_WAIT_SECONDS,
    };
  }
  switch (status) {
    case 403:
      return { ok: false, problem: "guest" };
    case 409: {
      // The two 409s differ only in their English text. The screen must not
      // read that text, so tell them apart by what the app already knows:
      // the account's own verified email.
      const own =
        !!current?.verified &&
        normalizeEmail(String(current?.email ?? "")) === normalizeEmail(requested);
      return { ok: false, problem: own ? "already-verified" : "in-use" };
    }
    case 429:
      return isUsualBody(answer)
        ? {
            ok: false,
            problem: "too-soon",
            retryAfterSeconds:
              seconds(answer?.data?.retry_after_seconds) ?? FALLBACK_WAIT_SECONDS,
          }
        : {
            ok: false,
            problem: "rate-limited",
            retryAfterSeconds: FALLBACK_WAIT_SECONDS,
          };
    default:
      return { ok: false, problem: "failed" };
  }
}

/** The answer of the code check. */
export function readVerifyAnswer(answer: any): VerifyEmailCodeResult {
  const status = Number(answer?.httpStatus);
  if (answer?.success && status === 200) {
    const user = answer?.data?.user;
    // A 200 with no customer is not a verified email: nothing to store.
    if (user && typeof user === "object") return { ok: true, user };
    return { ok: false, problem: "failed" };
  }
  switch (status) {
    case 422: {
      // Only the wrong-code 422 carries `attempts_left`. A 422 without it is a
      // validation error (a developer error), not the shopper's mistake.
      const left = seconds(answer?.data?.attempts_left);
      if (left === undefined) return { ok: false, problem: "failed" };
      return left > 0
        ? { ok: false, problem: "wrong-code", attemptsLeft: left }
        : { ok: false, problem: "no-tries-left", attemptsLeft: 0 };
    }
    case 410:
      return { ok: false, problem: "expired" };
    case 404:
      return { ok: false, problem: "no-code" };
    case 409:
      return { ok: false, problem: "in-use" };
    case 403:
      return { ok: false, problem: "guest" };
    case 429:
      return { ok: false, problem: "rate-limited" };
    default:
      return { ok: false, problem: "failed" };
  }
}

/**
 * The profile update refuses a new email that was not verified with a code
 * (backend PR #699): HTTP 400, and the refusal names the `email` field.
 *
 * The test is the status and the field, not the sentence: the backend can
 * write the sentence in the app's language. Two places can carry the field —
 * `detailed_error` as `{ email: [...] }`, or `message` as that object written
 * as JSON (how `/customer/update-profile` packs its refusals, see
 * utils/fieldErrors.ts).
 */
export function isEmailVerifyRefusal(answer: any): boolean {
  if (Number(answer?.httpStatus) !== 400) return false;
  const detailed = answer?.detailed_error;
  if (
    detailed &&
    typeof detailed === "object" &&
    !Array.isArray(detailed) &&
    detailed.email
  ) {
    return true;
  }
  return !!parseFieldErrors(answer?.message)?.some((f) => f.field === "email");
}

/**
 * Thrown by `auth.UpdateProfile` when the backend asks for the email code
 * first. The caller opens the email code sheet, and sends the change again
 * after a right code. Nothing was put on screen for this refusal.
 */
export class EmailVerificationRequiredError extends Error {
  constructor() {
    super("Verify the new email with a code to change your email.");
    this.name = "EmailVerificationRequiredError";
  }
}

/** The translation key for each problem. Every key is in ar / tr / ku and in DEMO_KEYS. */
export const PROBLEM_KEY = {
  "wrong-code": "Wrong Code",
  "no-tries-left": "Too many wrong codes. Ask for a new code.",
  expired: "The code expired. Ask for a new code.",
  "no-code": "This code no longer works. Ask for a new code.",
  "in-use": "This email is used by another account.",
  "already-verified": "This email is already verified on your account.",
  guest: "Sign in with your phone number first.",
  "too-soon": "Too many requests. Please try again in a moment.",
  "rate-limited": "Too many requests. Please try again in a moment.",
  failed: "Something went wrong",
} as const satisfies Record<EmailCodeProblem, string>;

/** After these, the code is dead: the boxes close and only "resend" helps. */
export const ENDS_THE_CODE: ReadonlySet<EmailCodeProblem> = new Set([
  "no-tries-left",
  "expired",
  "no-code",
]);

/** After these, no code can help: the boxes close and "resend" does not help either. */
export const ENDS_THE_SHEET: ReadonlySet<EmailCodeProblem> = new Set([
  "in-use",
  "already-verified",
  "guest",
]);
