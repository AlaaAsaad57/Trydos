// services/qrLogin/index.ts — the stand-in QR sign-in. The desktop opens a
// session, the phone scans it and approves or denies, and the desktop polls the
// status. Until the real endpoints exist, the record lives in localStorage.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveQrLogin,
  createQrSession,
  denyQrLogin,
  getQrStatus,
  markScanned,
  parseQrPayload,
} from "services/qrLogin";

const NOW = new Date("2026-09-01T10:00:00Z").getTime();
const realUA = navigator.userAgent;

const setUA = (ua: string) =>
  Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  setUA(realUA);
});

describe("createQrSession", () => {
  it("opens a pending session that lasts one minute", async () => {
    setUA("Mozilla/5.0 (Windows NT 10.0) Chrome/120");
    const session = await createQrSession();
    expect(session.qrPayload, "the QR text does not carry the request id").toBe(`trydos://qr/${session.requestId}`);
    expect(session.expiresAt, "the session does not last one minute").toBe(NOW + 60_000);
    expect(await getQrStatus(session.requestId), "the new session is not pending").toEqual({
      status: "pending",
      user: undefined,
      context: { browser: "Chrome", os: "Windows" },
    });
  });

  it("builds an id from the clock when crypto.randomUUID is missing", async () => {
    vi.stubGlobal("crypto", {});
    const session = await createQrSession();
    expect(session.requestId, "the fallback id is wrong").toMatch(/^\d+-\d+$/);
    expect(session.requestId.startsWith(`${NOW}-`), "the fallback id does not start with the clock").toBe(true);
  });

  it.each([
    ["Mozilla/5.0 (Windows NT 10.0) Edg/120", { browser: "Edge", os: "Windows" }],
    ["Mozilla/5.0 (Macintosh; Mac OS X) Firefox/120", { browser: "Firefox", os: "macOS" }],
    ["Mozilla/5.0 (Linux; Android 14) Safari/605", { browser: "Safari", os: "Android" }],
    ["Mozilla/5.0 (iPhone) Safari/605", { browser: "Safari", os: "iOS" }],
    ["Mozilla/5.0 (X11; Linux x86_64) Opera", { browser: "Browser", os: "Linux" }],
    ["curl/8", { browser: "Browser", os: "Device" }],
  ])("names %s as the right browser and system", async (ua, context) => {
    setUA(ua);
    const { requestId } = await createQrSession();
    expect((await getQrStatus(requestId)).context, `the device for "${ua}" is named wrongly`).toEqual(context);
  });
});

describe("getQrStatus", () => {
  it("says expired for an unknown id, a broken record, or a pending session past its time", async () => {
    localStorage.setItem("qr:broken", "{not json");
    const { requestId } = await createQrSession();
    vi.setSystemTime(NOW + 60_001);
    expect(await getQrStatus("nope"), "an unknown id is not expired").toEqual({ status: "expired" });
    expect(await getQrStatus("broken"), "a broken record is not expired").toEqual({ status: "expired" });
    expect(await getQrStatus(requestId), "a timed-out session is not expired").toEqual({ status: "expired" });
  });

  it("keeps an approved or denied answer after the time runs out", async () => {
    const a = await createQrSession();
    const b = await createQrSession();
    await approveQrLogin(a.requestId, { name: "Alaa" });
    await denyQrLogin(b.requestId);
    vi.setSystemTime(NOW + 120_000);
    expect(await getQrStatus(a.requestId), "the approval was lost after expiry").toMatchObject({
      status: "approved",
      user: { name: "Alaa" },
    });
    expect((await getQrStatus(b.requestId)).status, "the denial was lost after expiry").toBe("denied");
  });
});

describe("parseQrPayload", () => {
  it("reads the id from the app link or from a web link, and nothing from other text", () => {
    expect(parseQrPayload("trydos://qr/abc-123"), "the app link was not read").toBe("abc-123");
    expect(parseQrPayload("https://trydos.com/qr?req=xyz"), "the web link was not read").toBe("xyz");
    expect(parseQrPayload("https://trydos.com/qr"), "a web link with no id gave one").toBeNull();
    expect(parseQrPayload("hello"), "plain text gave an id").toBeNull();
  });
});

describe("markScanned, approveQrLogin, denyQrLogin", () => {
  it("moves a pending session to scanned, and only a pending one", async () => {
    const { requestId } = await createQrSession();
    await markScanned(requestId);
    expect((await getQrStatus(requestId)).status, "the scan was not recorded").toBe("scanned");
    await denyQrLogin(requestId);
    await markScanned(requestId);
    expect((await getQrStatus(requestId)).status, "a denied session went back to scanned").toBe("denied");
    await markScanned("nope");
    expect(localStorage.getItem("qr:nope"), "a scan created a session").toBeNull();
  });

  it("approves a scanned session in time, but not an expired one", async () => {
    const a = await createQrSession();
    await markScanned(a.requestId);
    expect(await approveQrLogin(a.requestId, { name: "A" }), "approve did not answer ok").toEqual({ ok: true });
    expect((await getQrStatus(a.requestId)).status, "the scanned session was not approved").toBe("approved");

    const b = await createQrSession();
    vi.setSystemTime(NOW + 60_001);
    await approveQrLogin(b.requestId, { name: "B" });
    await approveQrLogin("nope", { name: "C" });
    const raw = JSON.parse(localStorage.getItem(`qr:${b.requestId}`)!);
    expect(raw.status, "an expired session was approved").toBe("pending");
  });

  it("records a bare denial for an id it never saw", async () => {
    await denyQrLogin("ghost");
    expect(JSON.parse(localStorage.getItem("qr:ghost")!), "the deny wrote a bare record").toEqual({
      status: "denied",
    });
  });

  it("does nothing on the server", async () => {
    vi.stubGlobal("window", undefined);
    await denyQrLogin("srv");
    expect(await getQrStatus("srv"), "the server read a record").toEqual({ status: "expired" });
  });
});
