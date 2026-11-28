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

describe("reqLogger structured JSON mode (LOG_FORMAT=json)", () => {
  it("emits single-line structured JSON with request_id and scrubbed credentials", async () => {
    vi.stubEnv("LOG_FORMAT", "json");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (globalThis as any).__trydosRequestContext = {
      getStore: () => ({ requestId: "req-corr-99" }),
    };

    try {
      const { logRequest } = await import("reqLogger");
      await logRequest({
        server: "market",
        url: "/qr-login/app/id-1/claim",
        method: "POST",
        status: 409,
        requestBody: { secret_hash: HASH, ip: IP, city: "Aleppo" },
        userId: "1",
        userName: "tester",
      });

      const line = String(logSpy.mock.calls[0]?.[0] ?? "");
      const parsed = JSON.parse(line);
      expect(parsed.service, "JSON log should set service=trydos-storefront").toBe(
        "trydos-storefront",
      );
      expect(parsed.component, "JSON log should set component=BackendClient").toBe(
        "BackendClient",
      );
      expect(parsed.level, "409 response should log at warn level").toBe("warn");
      expect(parsed.request_id, "JSON log should inherit active request_id").toBe(
        "req-corr-99",
      );
      expect(parsed.path, "JSON log should include normalized path").toBe(
        "/qr-login/app/id-1/claim",
      );
      expect(line, "JSON log must still redact secret_hash").not.toContain(HASH);
      expect(line, "JSON log must still redact ip").not.toContain(IP);
      expect(parsed.request_body?.city, "non-secret fields should survive scrubbing").toBe(
        "Aleppo",
      );

      await logRequest({
        server: "market",
        url: "/orders",
        method: "POST",
        status: 500,
        userId: "1",
      });
      const errLine = String(errorSpy.mock.calls[0]?.[0] ?? "");
      const parsedErr = JSON.parse(errLine);
      expect(parsedErr.level, "500 response should log at error level on stderr").toBe(
        "error",
      );
    } finally {
      delete (globalThis as any).__trydosRequestContext;
    }
  });
});
