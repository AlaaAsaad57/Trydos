// @vitest-environment node
//
// utils/firebaseAdmin.ts — the server-side Firebase app the push routes use.
// It is created once from three env settings, and reused after that.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const admin = vi.hoisted(() => {
  const app = { messaging: vi.fn(() => ({ send: "messaging" })) };
  return {
    app: vi.fn(() => app),
    apps: [] as any[],
    initializeApp: vi.fn((_o: any) => app),
    credential: { cert: vi.fn((c: any) => ({ cert: c })) },
    _app: app,
  };
});
vi.mock("firebase-admin", () => ({ default: admin }));

import { getFirebaseAdminApp, getFirebaseMessaging } from "utils/firebaseAdmin";

beforeEach(() => {
  vi.clearAllMocks();
  admin.apps.length = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe("getFirebaseAdminApp", () => {
  it("says which settings are missing", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "p");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    expect(() => getFirebaseAdminApp(), "missing settings did not stop the start").toThrow(
      "Missing Firebase Admin env vars: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
    );
  });

  it("creates the app with the key's escaped line breaks turned into real ones", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "p");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "e@x");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "line1\nline2");
    expect(getFirebaseAdminApp(), "the new app was not returned").toBe(admin._app);
    expect(admin.credential.cert, "the credential is wrong").toHaveBeenCalledWith({
      projectId: "p",
      clientEmail: "e@x",
      privateKey: "line1\nline2",
    });
  });

  it("reuses the app that already exists", () => {
    admin.apps.push({});
    expect(getFirebaseAdminApp(), "the existing app was not reused").toBe(admin._app);
    expect(admin.initializeApp, "a second app was created").not.toHaveBeenCalled();
  });
});

describe("getFirebaseMessaging", () => {
  it("returns messaging from the app", () => {
    admin.apps.push({});
    expect(getFirebaseMessaging(), "messaging was not returned").toEqual({ send: "messaging" });
  });
});
