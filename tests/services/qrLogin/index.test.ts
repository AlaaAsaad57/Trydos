// services/qrLogin/index.ts — the browser side of QR login. It calls only our
// own routes under /api/qr-login (docs/qr-login-tasks.md, section 3). On a 401
// it runs the app's shared market refresh once and sends the call again,
// because the market access token lives 60 seconds.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeMockFetch, jsonReply } from "../../mocks/mockFetch";

const RefreshSession = vi.fn();
vi.mock("services/auth", () => ({ default: { RefreshSession } }));

import {
  approveDevice,
  completeQrLogin,
  createDeviceQrSession,
  createQrSession,
  denyDevice,
  getDeviceQrStatus,
  getQrStatus,
  QrLoginError,
} from "services/qrLogin";

const ID = "3f1c2a7e-8b4d-4c1a-9e2f-6a7b8c9d0e1f";
let net: ReturnType<typeof makeMockFetch>;

beforeEach(() => {
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
  RefreshSession.mockResolvedValue({ refreshed: true, eligible: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Direction A calls", () => {
  it("createQrSession posts to /api/qr-login/create and returns the session", async () => {
    const session = { requestId: ID, qrPayload: `trydos://qr/web/${ID}`, expiresAt: 1 };
    net.queueReply(jsonReply(session));
    const result = await createQrSession();
    expect(net.calls[0]?.url, "createQrSession called the wrong route").toBe("/api/qr-login/create");
    expect(net.calls[0]?.method, "createQrSession did not POST").toBe("POST");
    expect(result, "createQrSession did not return the route's session").toEqual(session);
  });

  it("getQrStatus asks /api/qr-login/status for this ID", async () => {
    net.queueReply(jsonReply({ status: "scanned" }));
    const result = await getQrStatus(ID);
    expect(net.calls[0]?.url, "getQrStatus called the wrong route").toBe(`/api/qr-login/status?id=${ID}`);
    expect(result, "getQrStatus did not return the status").toEqual({ status: "scanned" });
  });

  it.each([410, 404])("getQrStatus reads %s as expired, so the screen makes a new code", async (code) => {
    net.queueReply(jsonReply({ error: "expired" }, code));
    expect(await getQrStatus(ID), `a ${code} was not read as expired`).toEqual({ status: "expired" });
  });

  it("completeQrLogin posts the request ID to /api/qr-login/complete", async () => {
    net.queueReply(jsonReply({ data: { user: { id: 1 } } }));
    await completeQrLogin(ID);
    expect(net.calls[0]?.url, "completeQrLogin called the wrong route").toBe("/api/qr-login/complete");
    expect(net.calls[0]?.body, "completeQrLogin did not send the request ID").toEqual({ requestId: ID });
  });

  it("throws a QrLoginError with the route's error word", async () => {
    net.queueReply(jsonReply({ error: "conflict" }, 409));
    const error = await completeQrLogin(ID).catch((e) => e);
    expect(error, "a refused complete did not throw a QrLoginError").toBeInstanceOf(QrLoginError);
    expect(error.status, "the QrLoginError lost the HTTP code").toBe(409);
    expect(error.code, "the QrLoginError lost the error word").toBe("conflict");
  });
});

describe("Direction B calls", () => {
  it("createDeviceQrSession posts to /api/qr-login/device/create", async () => {
    net.queueReply(jsonReply({ requestId: ID, qrPayload: `trydos://qr/app/${ID}`, expiresAt: 1 }));
    await createDeviceQrSession();
    expect(net.calls[0]?.url, "createDeviceQrSession called the wrong route").toBe(
      "/api/qr-login/device/create",
    );
  });

  it("getDeviceQrStatus returns the device name", async () => {
    net.queueReply(jsonReply({ status: "claimed", deviceName: "Alaa's iPhone", platform: "ios" }));
    const result = await getDeviceQrStatus(ID);
    expect(net.calls[0]?.url, "getDeviceQrStatus called the wrong route").toBe(
      `/api/qr-login/device/status?id=${ID}`,
    );
    expect(result.deviceName, "getDeviceQrStatus lost the device name").toBe("Alaa's iPhone");
  });

  it("getDeviceQrStatus reads 410 as expired", async () => {
    net.queueReply(jsonReply({ error: "expired" }, 410));
    expect((await getDeviceQrStatus(ID)).status, "a 410 was not read as expired").toBe("expired");
  });

  it.each([
    ["approveDevice", approveDevice, "/api/qr-login/device/approve"],
    ["denyDevice", denyDevice, "/api/qr-login/device/deny"],
  ])("%s posts the request ID to its route", async (_name, fn, url) => {
    net.queueReply(jsonReply({ status: "approved" }));
    await fn(ID);
    expect(net.calls[0]?.url, `${_name} called the wrong route`).toBe(url);
    expect(net.calls[0]?.body, `${_name} did not send the request ID`).toEqual({ requestId: ID });
  });
});

describe("a 401 from a route (the 60-second token ran out)", () => {
  it("runs the shared market refresh once and sends the call again", async () => {
    net.queueReply(jsonReply({ error: "unauthorized" }, 401));
    net.queueReply(jsonReply({ status: "claimed", deviceName: null, platform: null }));
    const result = await getDeviceQrStatus(ID);
    expect(RefreshSession, "a 401 did not start the shared market refresh").toHaveBeenCalledOnce();
    expect(RefreshSession.mock.calls[0]?.[1], "the refresh was not for the market pair").toBe("market");
    expect(net.calls[1]?.url, "the call was not sent again after the refresh").toBe(
      `/api/qr-login/device/status?id=${ID}`,
    );
    expect(result.status, "the retried call's answer was not returned").toBe("claimed");
  });

  it("gives up after one retry, so polling never loops on refresh", async () => {
    net.queueReply(jsonReply({ error: "unauthorized" }, 401));
    net.queueReply(jsonReply({ error: "unauthorized" }, 401));
    const error = await createDeviceQrSession().catch((e) => e);
    expect(RefreshSession, "a second 401 started a second refresh").toHaveBeenCalledOnce();
    expect(error?.status, "the second 401 did not reach the caller").toBe(401);
  });

  it("does not retry when the refresh is not allowed (a logout is running)", async () => {
    RefreshSession.mockResolvedValue({ refreshed: false, eligible: false });
    net.queueReply(jsonReply({ error: "unauthorized" }, 401));
    const error = await createQrSession().catch((e) => e);
    expect(net.callCount, "the call was sent again during a logout").toBe(1);
    expect(error?.status, "the 401 did not reach the caller").toBe(401);
  });
});
