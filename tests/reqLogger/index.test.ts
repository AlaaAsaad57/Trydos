// reqLogger writes one line per backend call. A body can carry a credential or
// personal data, so the line must hide them. QR login sends two of them:
// - `secret_hash`: the claiming phone also uses it as its proof (X-QR-Secret-Hash).
// - `ip`: the shopper's IP address, sent with web/create and app/claim.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const HASH = "4b1d0000000000000000000000000000000000000000000000000000000000aa";
const IP = "5.0.0.11";

beforeEach(() => {
  // REQ_LOG is read once when the module loads.
  vi.resetModules();
  vi.stubEnv("REQ_LOG", "1");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function logLine(requestBody: unknown) {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const { logRequest } = await import("reqLogger");
  // A failed call, so the body is always logged.
  await logRequest({
    server: "market",
    url: "/qr-login/app/id-1/claim",
    method: "POST",
    status: 409,
    requestBody,
    userId: "1",
    userName: "tester",
  });
  return String(error.mock.calls[0]?.[0] ?? "");
}

describe("reqLogger hides QR login values", () => {
  it("hides the QR secret's hash, because the phone uses it as its proof", async () => {
    const line = await logLine({ secret_hash: HASH, device_name: "Chrome, iOS" });
    expect(line, "the log line was not written").toContain("/qr-login/app/id-1/claim");
    expect(line, "the log line shows the QR secret's hash").not.toContain(HASH);
  });

  it("hides the shopper's IP address", async () => {
    const line = await logLine({ secret_hash: HASH, ip: IP, city: "Aleppo" });
    expect(line, "the log line shows the shopper's IP address").not.toContain(IP);
    expect(line, "the log line lost a field that is not secret (city)").toContain("Aleppo");
  });
});
