// Stand-ins for the Server Actions.
//
// WHY THIS IS NEEDED AT ALL
// A file that starts with "use server" is not ordinary code. Next replaces it,
// for anything on the client side, with a small stub that calls the server; the
// body never reaches the browser. The test runner does no such thing — it just
// loads the file, and with it everything the file imports.
//
// serverActions/sendOtp.ts is imported by services/auth.ts, which is imported by
// utils/fetchData.ts, which is imported by utils/functions.tsx and the shared
// store. So *any* component test would pull the whole server side in behind it:
// next/headers, the cookie manager, and — worst of all — ioredis, which opens a
// real connection the moment it loads. Roadmap rule 5 says no test performs real
// I/O, and that is exactly how it would happen by accident.
//
// Replacing the action stops the chain at the same place Next stops it, which is
// why this is a stand-in and not a change to the code under test.
//
// TO CHECK OR CHANGE WHAT IT DOES
//
//   import { serverActionSpies } from "tests/mocks/serverActions";
//
//   serverActionSpies.sendOtpAction.mockResolvedValue({
//     success: true,
//     verificationId: "test-verification-id",
//     message: "",
//   });
//   expect(serverActionSpies.sendOtpAction).toHaveBeenCalledWith({ phone: "…" });

/** The reply shape of serverActions/sendOtp.ts. */
export type SendOtpResult = {
  success: boolean;
  verificationId?: string;
  message: string;
  lockSeconds?: number;
  blocked?: boolean;
  reason?: string;
};

/**
 * Every Server Action, ready to check.
 *
 * The default reply is a failure, on purpose: a test that means to send an OTP
 * has to say so. A default success would let a test pass while proving nothing.
 */
export const serverActionSpies = {
  sendOtpAction: vi.fn(
    async (): Promise<SendOtpResult> => ({
      success: false,
      message:
        "No reply was set for sendOtpAction. Set one with " +
        "serverActionSpies.sendOtpAction.mockResolvedValue({ … }).",
    }),
  ),
};

/** Build the stand-in for serverActions/sendOtp. */
export function makeSendOtpActionMock() {
  return { sendOtpAction: serverActionSpies.sendOtpAction };
}

/** Forget every recorded call. tests/setup.ts does this after each test. */
export function resetServerActionSpies() {
  Object.values(serverActionSpies).forEach((spy) => spy.mockClear());
}
