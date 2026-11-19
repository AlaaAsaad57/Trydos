// The answers of the core backend's email code endpoints, read into what the
// email code sheet shows (customer-email-otp-frontend-guide.md).
//
// Each answer below is the body the contract gives, as `fetchData` hands it
// back: the body spread, plus `success` and `httpStatus`.

import { describe, expect, it } from "vitest";

import {
  FALLBACK_WAIT_SECONDS,
  isEmailVerifyRefusal,
  readSendAnswer,
  readVerifyAnswer,
} from "services/customerEmail";

const refused = (httpStatus: number, extra: Record<string, any> = {}) => ({
  isSuccessful: false,
  hasContent: false,
  code: httpStatus,
  message: "English text for developers only",
  detailed_error: [{ message: "English text for developers only" }],
  data: null,
  success: false,
  httpStatus,
  ...extra,
});

const problemOf = (result: any) => ("problem" in result ? result.problem : "ok");

describe("send-otp answers (core backend)", () => {
  it("reads the saved address and the resend wait from a 200", () => {
    const result: any = readSendAnswer(
      {
        isSuccessful: true,
        code: 200,
        data: {
          email: "new.address@example.com",
          expires_at: "2026-11-18T14:31:14Z",
          resend_after_seconds: 120,
        },
        success: true,
        httpStatus: 200,
      },
      "New.Address@example.com",
    );
    expect(problemOf(result), "a 200 from send-otp was read as a failure").toBe("ok");
    expect(result.email, "the sheet must show the address the backend saved").toBe(
      "new.address@example.com",
    );
    expect(
      result.resendAfterSeconds,
      "the resend timer must come from resend_after_seconds, not a fixed value",
    ).toBe(120);
  });

  it("tells 'used by another account' from 'already yours' without reading the message", () => {
    expect(
      problemOf(readSendAnswer(refused(409), "a@example.com", { email: "b@example.com", verified: true })),
      "a 409 for an address that is not the account's own must say it is used by another account",
    ).toBe("in-use");
    expect(
      problemOf(readSendAnswer(refused(409), " A@Example.com", { email: "a@example.com", verified: true })),
      "a 409 for the account's own verified address must say it is already verified",
    ).toBe("already-verified");
  });

  it("reads the resend wait from the usual 429 body", () => {
    const result: any = readSendAnswer(
      refused(429, { data: { retry_after_seconds: 87 } }),
      "a@example.com",
    );
    expect(problemOf(result), "a usual-format 429 is the resend wait").toBe("too-soon");
    expect(result.retryAfterSeconds, "the wait must come from data.retry_after_seconds").toBe(87);
  });

  it("reads Laravel's own 429 body as the request limit", () => {
    const result: any = readSendAnswer(
      { message: "Too Many Attempts.", success: false, httpStatus: 429 },
      "a@example.com",
    );
    expect(problemOf(result), "a 429 without isSuccessful is the request limit").toBe(
      "rate-limited",
    );
    expect(
      result.retryAfterSeconds,
      "the request limit has no wait in its body, so the fallback wait applies",
    ).toBe(FALLBACK_WAIT_SECONDS);
  });

  it("reads a guest", () => {
    expect(problemOf(readSendAnswer(refused(403), "a@example.com")), "a 403 is a guest").toBe(
      "guest",
    );
  });
});

describe("verify-otp answers (core backend)", () => {
  it("reads the customer from a 200", () => {
    const result: any = readVerifyAnswer({
      isSuccessful: true,
      data: { user: { id: 1234, email: "new.address@example.com", is_email_verified: 1 } },
      success: true,
      httpStatus: 200,
    });
    expect(problemOf(result), "a 200 from verify-otp was read as a failure").toBe("ok");
    expect(result.user.email, "the verified customer was not handed back").toBe(
      "new.address@example.com",
    );
  });

  it("does not read a 200 with no customer as verified", () => {
    expect(
      problemOf(readVerifyAnswer({ success: true, httpStatus: 200, data: {} })),
      "a 200 without data.user must not count as a verified email",
    ).toBe("failed");
  });

  it("reads a wrong code with the tries left", () => {
    const result: any = readVerifyAnswer(refused(422, { data: { attempts_left: 4 } }));
    expect(problemOf(result), "a 422 with attempts_left is a wrong code").toBe("wrong-code");
    expect(result.attemptsLeft, "the tries left must come from data.attempts_left").toBe(4);
  });

  it("reads the last wrong code as a dead code", () => {
    expect(
      problemOf(readVerifyAnswer(refused(422, { data: { attempts_left: 0 } }))),
      "a wrong code with 0 tries left must send the shopper back to 'resend'",
    ).toBe("no-tries-left");
  });

  it("does not read a validation 422 as the shopper's wrong code", () => {
    expect(
      problemOf(
        readVerifyAnswer(refused(422, { detailed_error: [{ code: "code", message: "x" }] })),
      ),
      "a 422 without attempts_left is a validation error, not a wrong code",
    ).toBe("failed");
  });

  it("reads expired, no code, taken and guest by status", () => {
    expect(problemOf(readVerifyAnswer(refused(410))), "a 410 is an expired code").toBe("expired");
    expect(problemOf(readVerifyAnswer(refused(404))), "a 404 is no code waiting").toBe("no-code");
    expect(
      problemOf(readVerifyAnswer(refused(409))),
      "a 409 on verify-otp is an address another account took",
    ).toBe("in-use");
    expect(problemOf(readVerifyAnswer(refused(403))), "a 403 is a guest").toBe("guest");
  });
});

describe("the profile update's 'verify the new email' answer (backend PR #699)", () => {
  it("is found by the 400 and the email field, in either place the field can sit", () => {
    expect(
      isEmailVerifyRefusal({
        success: false,
        httpStatus: 400,
        message: '{"email":["Verify the new email with a code to change your email."]}',
      }),
      "a 400 naming email inside message was not seen as the email code request",
    ).toBe(true);
    expect(
      isEmailVerifyRefusal({
        success: false,
        httpStatus: 400,
        message: "تحقق من البريد الجديد",
        detailed_error: { email: ["تحقق من البريد الجديد"] },
      }),
      "a 400 naming email in detailed_error, in another language, was not seen as the email code request",
    ).toBe(true);
  });

  it("is not any other refusal", () => {
    expect(
      isEmailVerifyRefusal({
        success: false,
        httpStatus: 422,
        message: '{"email":["email already exists"]}',
      }),
      "a 422 on the email field is an ordinary refusal, not the email code request",
    ).toBe(false);
    expect(
      isEmailVerifyRefusal({ success: false, httpStatus: 400, message: '{"name":["too short"]}' }),
      "a 400 on another field is not the email code request",
    ).toBe(false);
  });
});
