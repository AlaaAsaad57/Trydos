// Renaming, updating the profile across the shopper's services, and the picture.
//
// FAKE TIMERS ARE A FILE-LEVEL RULE HERE. The profile update ends with a fixed
// 1500 ms wait on its success path, and every success criterion goes through it.
// Left real, this file alone would cost about nine seconds. The wait sits inside
// an awaited chain, so a synchronous clock advance never reaches it — the
// pattern is: start the call, advance the clock asynchronously, then await.
// Restoring real timers is the FIRST thing the teardown does, because the shared
// setup's own teardown awaits a dynamic import and resets the fake network.
//
// Delayed replies from the shared network stand-in are not used in this file:
// its delay awaits a real timeout, which fake timers would never fire.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeMockFetch, jsonReply } from "tests/mocks/mockFetch";
import { queueReplies } from "tests/mocks/authGraph";

vi.mock("store", async () => {
  const { makeAuthStoreModule } = await import("tests/mocks/authStore");
  return makeAuthStoreModule();
});
vi.mock("serverActions/sendOtp", async () => (await import("tests/mocks/authGraph")).makeSendOtpMock());
vi.mock("utils/functions", async () => (await import("tests/mocks/authGraph")).makeFunctionsMock());
vi.mock("utils/otpLocks", async () => (await import("tests/mocks/authGraph")).makeOtpLocksMock());
vi.mock("utils/fetchData", async () => (await import("tests/mocks/authGraph")).makeFetchDataMock());
vi.mock("utils/authMe", async () => (await import("tests/mocks/authGraph")).makeAuthMeMock());
vi.mock("utils/gtag", async () => (await import("tests/mocks/authGraph")).makeGtagMock());
vi.mock("utils/posthog", async () => (await import("tests/mocks/authGraph")).makePosthogMock());
vi.mock("utils/orderFunnel", async () => (await import("tests/mocks/authGraph")).makeOrderFunnelMock());
vi.mock("utils/GAEvents", async () => (await import("tests/mocks/authGraph")).makeGaEventNamesMock());
vi.mock("utils/Requests", async () => (await import("tests/mocks/authGraph")).makeRequestsMock());
vi.mock("utils/serverErrorReporter", async () => (await import("tests/mocks/authGraph")).makeErrorReporterMock());
vi.mock("utils/UploadUtils", async () => (await import("tests/mocks/authGraph")).makeUploadUtilsMock());
vi.mock("utils/cookies/cookie-manager", async () => (await import("tests/mocks/authGraph")).makeCookieNamesMock());
vi.mock("@/store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("services/home", async () => (await import("tests/mocks/authGraph")).makeHomeServiceMock());
vi.mock("services/story", async () => (await import("tests/mocks/authGraph")).makeStoryServiceMock());
vi.mock("services/wallet", async () => (await import("tests/mocks/authGraph")).makeWalletMock());

const auth = (await import("services/auth")).default;
const store = await import("store");
const fetchDataModule = await import("utils/fetchData");
const authMe = await import("utils/authMe");
const notifications = await import("@/store/notifications/reducer");
const home = (await import("services/home")).default;

let market: ReturnType<typeof queueReplies>;
let net: ReturnType<typeof makeMockFetch>;

const OK = { success: true };
/** The fixed wait the profile update ends with. */
const SETTLE_MS = 1500;

/** Start the call, let the fixed wait elapse, then take the result. */
async function withSettle<T>(run: () => Promise<T>): Promise<T> {
  const pending = run();
  await vi.advanceTimersByTimeAsync(SETTLE_MS);
  return pending;
}

beforeEach(() => {
  vi.useFakeTimers();
  (store as any).__resetAuthStore();

  (fetchDataModule.fetchData as any).mockReset();
  market = queueReplies(fetchDataModule.fetchData, "fetchData");
  (authMe.fetchAuthMe as any).mockReset();
  (authMe.fetchAuthMe as any).mockResolvedValue(null);

  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
  window.history.replaceState({}, "", "/gb-en/settings/profile");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("renaming (AC-23)", () => {
  it("writes the new name to the state and to all three profile copies before any request", async () => {
    (store as any).__resetAuthStore({ user: { id: 7, name: "old" } });
    market.reply(OK); // market
    market.reply(OK); // chat
    market.reply(OK); // stories

    await auth.UpdateName("Ada");

    expect(store.useAppStore.getState().user.name).toBe("Ada");
    expect(net.calls[0].url).toBe("/api/auth/update-user");
    expect(net.calls[0].body.updates.map((u: any) => u.name)).toEqual([
      "User-Data",
      "User-Chat",
      "User-Stories",
    ]);
  });

  it("puts the old name back and says so when a service refuses it", async () => {
    (store as any).__resetAuthStore({
      user: { id: 7, name: "old" },
      userProfile: { id: 7, name: "old" },
    });
    market.reply({ success: false, message: "rejected" });

    await auth.UpdateName("Ada");

    // The optimistic write is undone — a rename the backend refused must not be
    // left looking like it worked.
    expect(store.useAppStore.getState().user.name).toBe("old");
    expect(store.useAppStore.getState().userProfile.name).toBe("old");
    // …in the stored copies too, and the shopper is told.
    expect(net.calls[1].body.updates.map((u: any) => u.value.name)).toEqual([
      "old",
      "old",
      "old",
    ]);
    expect(notifications.showErrorNotification).toHaveBeenCalledWith(
      "Failed to update name",
    );
  });
});

describe("updating the profile", () => {
  it("looks up the missing service records before running the legs (AC-26)", async () => {
    (authMe.fetchAuthMe as any).mockResolvedValue({
      chatUser: { id: "c1" },
      storiesUser: { id: "s1" },
    });
    market.reply(OK); // stories
    market.reply(OK); // chat
    market.reply(OK); // market

    await withSettle(() => auth.UpdateProfile({ name: "Ada" }, {}));

    expect(authMe.fetchAuthMe).toHaveBeenCalled();
    const urls = (fetchDataModule.fetchData as any).mock.calls.map((c: any[]) => c[0].url);
    expect(urls).toEqual([
      "/api/v1/users/update",
      expect.stringContaining("/api/v1/users/"),
      "/customer/update-profile",
    ]);
  });

  it("writes both the shared state and that service's own copy, for each leg (AC-24)", async () => {
    (store as any).__resetAuthStore({
      userProfile: { id: 7, name: "old", phone: "+90555", image: "ada.png" },
      userChat: { id: "c1" },
      userStories: { id: "s1" },
    });
    market.reply(OK);
    market.reply(OK);
    market.reply(OK);

    await withSettle(() => auth.UpdateProfile({ name: "Ada" }, {}));

    const s = store.useAppStore.getState();
    expect(s.userStories).toMatchObject({ name: "Ada" });
    expect(s.userChat).toMatchObject({ name: "Ada" });
    expect(s.userProfile).toMatchObject({ name: "Ada" });
    // One secure-copy write per leg, in the same order.
    expect(net.calls.map((c) => c.body.updates[0].name)).toEqual([
      "User-Stories",
      "User-Chat",
      "User-Data",
    ]);
  });

  it("skips a leg the shopper has no record for (AC-24)", async () => {
    (store as any).__resetAuthStore({ userProfile: { id: 7, name: "old" } });
    market.reply(OK); // market only

    await withSettle(() => auth.UpdateProfile({ name: "Ada" }, {}));

    const urls = (fetchDataModule.fetchData as any).mock.calls.map((c: any[]) => c[0].url);
    expect(urls).toEqual(["/customer/update-profile"]);
    expect(net.calls).toHaveLength(1);
    expect(net.calls[0].body.updates[0].name).toBe("User-Data");
  });

  it("sends the picture path in the form each service expects (AC-24)", async () => {
    (store as any).__resetAuthStore({
      userProfile: { id: 7, name: "Ada" },
      userChat: { id: "c1" },
      userStories: { id: "s1" },
    });
    market.reply(OK);
    market.reply(OK);
    market.reply(OK);

    await withSettle(() => auth.UpdateProfile({ name: "Ada", image: "ada.png" }, {}));

    const calls = (fetchDataModule.fetchData as any).mock.calls;
    const stories = JSON.parse(calls[0][0].body);
    const chat = JSON.parse(calls[1][0].body);
    const marketBody = JSON.parse(calls[2][0].body);
    // The other services want the full path; the market wants the bare name.
    expect(stories.photo_path).toBe("/customers/profile/ada.png");
    expect(chat.photo_path).toBe("/customers/profile/ada.png");
    expect(marketBody.image).toBe("ada.png");
  });

  it("puts every completed leg back when a later one fails, and tells the shopper once (AC-25)", async () => {
    (store as any).__resetAuthStore({
      userProfile: { id: 7, name: "old", phone: "+90555" },
      userChat: { id: "c1", name: "old" },
      userStories: { id: "s1", name: "old" },
    });
    market.reply(OK); // stories succeeds
    market.reply(OK); // chat succeeds
    market.reply({ success: false, message: "market refused" }); // market fails
    market.reply(OK); // stories rollback
    market.reply(OK); // chat rollback

    await expect(auth.UpdateProfile({ name: "Ada" }, {})).rejects.toThrow("market refused");

    const urls = (fetchDataModule.fetchData as any).mock.calls.map((c: any[]) => c[0].url);
    // Three legs, then the two that had succeeded are put back.
    expect(urls).toHaveLength(5);
    expect(urls[3]).toBe("/api/v1/users/update");
    expect(urls[4]).toContain("/api/v1/users/");
    expect(notifications.showErrorNotification).toHaveBeenCalledTimes(1);
  });

  it("does not roll back a leg that never ran (AC-25)", async () => {
    (store as any).__resetAuthStore({ userProfile: { id: 7, name: "old" } });
    market.reply({ success: false, message: "market refused" });

    await expect(auth.UpdateProfile({ name: "Ada" }, {})).rejects.toThrow("market refused");

    // One call: the market leg. No record for chat or stories, so nothing to
    // undo — and the market leg itself never completed.
    expect((fetchDataModule.fetchData as any).mock.calls).toHaveLength(1);
  });
});

describe("picture paths (AC-27)", () => {
  it("strips the folder for the market and adds it for the other services", () => {
    expect(auth.ConfigurePhoto("/customers/profile/ada.png", "market")).toBe("ada.png");
    expect(auth.ConfigurePhoto("ada.png", "story")).toBe("/customers/profile/ada.png");
    expect(auth.ConfigurePhoto("ada.png", "chat")).toBe("/customers/profile/ada.png");
  });

  it("leaves a value that is already in the target form alone", () => {
    expect(auth.ConfigurePhoto("ada.png", "market")).toBe("ada.png");
    expect(auth.ConfigurePhoto("/customers/profile/ada.png", "story")).toBe(
      "/customers/profile/ada.png",
    );
  });

  it("reports nothing for an empty value on the service side", () => {
    expect(auth.ConfigurePhoto("", "story")).toBeNull();
    expect(auth.ConfigurePhoto(undefined, "story")).toBeNull();
  });

  it("adds the folder for the stored copy, and leaves an empty value as it is", () => {
    expect(auth.getImageForCookie("ada.png")).toBe("/customers/profile/ada.png");
    expect(auth.getImageForCookie("/customers/profile/ada.png")).toBe(
      "/customers/profile/ada.png",
    );
    expect(auth.getImageForCookie("")).toBe("");
  });
});

describe("uploading a picture", () => {
  it("refuses to run when the upload is not configured (AC-28)", async () => {
    // The runner leaves the media key empty on purpose, so this is the branch a
    // test gets without asking.
    await expect(auth.uploadToMediaServer(new File(["x"], "ada.png"))).rejects.toThrow(
      "Media server upload is not configured",
    );
    expect(net.calls).toHaveLength(0);
  });

  it("reports where the picture was stored (AC-28)", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_API_KEY", "test-key");
    net.queueReply(jsonReply({ url: "https://example.com/customers/profile/ada.png" }));

    const result = await auth.UpdateProfileImage(new File(["x"], "ada.png"));

    expect(result).toEqual({ sub_path: "https://example.com/customers/profile/ada.png" });
    expect(net.calls[0].url).toBe("https://example.com/gated/upload");
    expect(net.calls[0].headers["x-api-key"]).toBe("test-key");
    expect(net.calls[0].headers["x-upload-ticket"]).toBe("test-upload-ticket");
  });

  it("reports a failure rather than a picture when the upload is refused (AC-28)", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_API_KEY", "test-key");
    net.queueReply(jsonReply({ error: "file too large" }, 413));

    const result = await auth.UpdateProfileImage(new File(["x"], "ada.png"));

    expect(result).toBeNull();
  });

  it("reports the failure rather than raising when a refused upload's reply cannot be read (AC-29)", async () => {
    // It used to read `data.error` from a null value here and throw, instead of
    // returning the failure it was built to return.
    vi.stubEnv("NEXT_PUBLIC_MEDIA_API_KEY", "test-key");
    (net.fetch as any).mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    }));

    await expect(
      auth.uploadToMediaServer(new File(["x"], "ada.png")),
    ).resolves.toEqual({ error: "Upload failed", data: null });
  });
});
