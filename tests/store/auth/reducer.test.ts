// The auth slice, driven directly.
//
// This is the state every screen reads after a sign-in, a session expiry or a
// profile edit, so the transitions here are a contract for the whole app, not
// just for the sign-in service. The slice imports nothing, so each test builds
// its own copy — no stand-ins, no module reset, nothing shared between tests.
//
// Plain setters (`setFoo: (v) => set({ foo: v })`) are left out on purpose: they
// asserts that the state library works, not that our code does.

import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "store/auth/reducer";

/** A fresh slice, with its own state. Actions live on the state object. */
function makeSlice(overrides: Record<string, any> = {}) {
  let state: Record<string, any> = {};
  const set = (partial: any) => {
    const next = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;
  state = { ...useAuthStore(set, get), ...overrides };
  return {
    get s() {
      return state;
    },
  };
}

const shopper = { id: 7, name: "Ada", phone: "+905551112233", is_verified: 1 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cancelAuth (AC-30)", () => {
  it("keeps the shopper's records and marks them unverified when the session expired", () => {
    const slice = makeSlice({
      user: { ...shopper },
      userProfile: { ...shopper },
      userChat: { id: "c1", is_verified: 1 },
      userStories: { id: "s1", is_verified: 1 },
      userWallet: { id: "w1", is_verified: 1 },
      failedLogin: true,
      attempts: 1,
      wrongNumber: "wrong code",
    });

    slice.s.cancelAuth(true);

    // The records survive — a verified shopper is never silently turned into a
    // stranger; they are marked unverified so the re-login prompt can arm.
    expect(slice.s.user).toMatchObject({ id: 7, is_verified: 0, is_phone_verified: 0 });
    expect(slice.s.userProfile).toMatchObject({ id: 7, is_verified: 0, is_phone_verified: 0 });
    // The three service records also carry "this one needs to sign in again".
    expect(slice.s.userChat).toMatchObject({ id: "c1", is_verified: 0, need_auth: true });
    expect(slice.s.userStories).toMatchObject({ id: "s1", is_verified: 0, need_auth: true });
    expect(slice.s.userWallet).toMatchObject({ id: "w1", is_verified: 0, need_auth: true });
  });

  it("clears every record when the cancellation is not an expiry", () => {
    const slice = makeSlice({
      user: { ...shopper },
      userProfile: { ...shopper },
      userChat: { id: "c1" },
      userStories: { id: "s1" },
      userWallet: { id: "w1" },
    });

    slice.s.cancelAuth();

    expect(slice.s.user).toBeNull();
    expect(slice.s.userProfile).toBeNull();
    expect(slice.s.userChat).toBeNull();
    expect(slice.s.userStories).toBeNull();
    expect(slice.s.userWallet).toBeNull();
  });

  it("resets the attempt counter and the message on both routes", () => {
    for (const expired of [true, false]) {
      const slice = makeSlice({ failedLogin: true, attempts: 0, wrongNumber: "no" });
      slice.s.cancelAuth(expired);
      expect(slice.s.failedLogin).toBe(false);
      expect(slice.s.attempts).toBe(4);
      expect(slice.s.wrongNumber).toBe("");
    }
  });

  it("leaves an already-empty session empty rather than inventing records", () => {
    const slice = makeSlice();
    slice.s.cancelAuth(true);
    // Every branch is guarded, so a null record stays null instead of becoming
    // an object carrying only the unverified flags.
    expect(slice.s.user).toBeNull();
    expect(slice.s.userProfile).toBeNull();
    expect(slice.s.userChat).toBeNull();
  });
});

describe("sign-in writes (AC-31)", () => {
  it("merges into an existing service record", () => {
    const slice = makeSlice({ userChat: { id: "c1", name: "old", extra: true } });
    slice.s.loginSuccessChat({ name: "new", is_verified: 1 });
    expect(slice.s.userChat).toEqual({ id: "c1", name: "new", extra: true, is_verified: 1 });
  });

  it("replaces an absent service record with what it is given", () => {
    const slice = makeSlice();
    slice.s.loginSuccessStories({ id: "s1", name: "Ada" });
    expect(slice.s.userStories).toEqual({ id: "s1", name: "Ada" });
    slice.s.loginSuccessWallet({ id: "w1" });
    expect(slice.s.userWallet).toEqual({ id: "w1" });
  });

  it("merges the signed-in user and the profile, and clears the failure flag", () => {
    const slice = makeSlice({
      user: { id: 7, name: "old", keepMe: 1 },
      userProfile: { id: 7, weight: 70 },
      failedLogin: true,
    });

    slice.s.loginSuccess({ name: "Ada", is_verified: 1 });

    expect(slice.s.user).toEqual({ id: 7, name: "Ada", keepMe: 1, is_verified: 1 });
    expect(slice.s.userProfile).toEqual({ id: 7, weight: 70, name: "Ada", is_verified: 1 });
    expect(slice.s.failedLogin).toBe(false);
  });
});

describe("failed attempts (AC-32)", () => {
  it("flags the failure and spends one attempt", () => {
    const slice = makeSlice();
    expect(slice.s.attempts).toBe(4);
    slice.s.loginFailed();
    expect(slice.s.failedLogin).toBe(true);
    expect(slice.s.attempts).toBe(3);
  });

  it("stops at zero rather than going negative", () => {
    const slice = makeSlice({ attempts: 1 });
    slice.s.loginFailed();
    slice.s.loginFailed();
    slice.s.loginFailed();
    // "No attempts left" is the real state; a negative count is not something a
    // screen can mean.
    expect(slice.s.attempts).toBe(0);
  });
});

describe("notification topics (AC-33)", () => {
  it("adds one topic and leaves the rest alone", () => {
    const slice = makeSlice();
    slice.s.enableNotification("orders");
    slice.s.enableNotification("offers");
    expect(slice.s.firebaseSettings.subscribed_topics).toEqual([
      { topic: "orders" },
      { topic: "offers" },
    ]);
  });

  it("removes only the topic it is given", () => {
    const slice = makeSlice();
    slice.s.enableNotification("orders");
    slice.s.enableNotification("offers");
    slice.s.disableNotification("orders");
    expect(slice.s.firebaseSettings.subscribed_topics).toEqual([{ topic: "offers" }]);
  });

  it("keeps the other notification settings untouched", () => {
    const slice = makeSlice();
    slice.s.enableNotification("orders");
    expect(slice.s.firebaseSettings.email).toBe(0);
    expect(slice.s.firebaseSettings.unsubscribed_topics).toEqual([]);
  });
});

describe("renaming (AC-34)", () => {
  it("updates the signed-in user AND the profile record", () => {
    const slice = makeSlice({
      user: { id: 7, name: "old" },
      userProfile: { id: 7, name: "old", weight: 70 },
    });

    slice.s.updateName("Ada");

    expect(slice.s.user.name).toBe("Ada");
    expect(slice.s.Tempuser.name).toBe("Ada");
    // The profile record is what `auth.getUser()` reads. Leaving it behind
    // showed the new name in one place and the old one in another.
    expect(slice.s.userProfile).toEqual({ id: 7, name: "Ada", weight: 70 });
  });

  it("renames onto an absent profile without throwing", () => {
    const slice = makeSlice({ user: { id: 7 } });
    slice.s.updateName("Ada");
    expect(slice.s.userProfile).toEqual({ name: "Ada" });
  });
});

describe("the other merge shapes (AC-31)", () => {
  it("editUserInfo merges into both the profile and the signed-in user", () => {
    const slice = makeSlice({ userProfile: { id: 7, name: "Ada" }, user: { id: 7 } });
    slice.s.editUserInfo({ weight: 70 });
    expect(slice.s.userProfile).toEqual({ id: 7, name: "Ada", weight: 70 });
    expect(slice.s.user).toEqual({ id: 7, weight: 70 });
  });

  it("updateUserInfo replaces the profile and merges the signed-in user", () => {
    const slice = makeSlice({ userProfile: { id: 7, name: "Ada", weight: 70 }, user: { id: 7 } });
    slice.s.updateUserInfo({ id: 7, name: "Grace" });
    expect(slice.s.userProfile).toEqual({ id: 7, name: "Grace" });
    expect(slice.s.user).toEqual({ id: 7, name: "Grace" });
  });

  it("updateUserIsVerified merges into the profile only", () => {
    const slice = makeSlice({ userProfile: { id: 7 }, user: { id: 7 } });
    slice.s.updateUserIsVerified({ is_phone_verified: 1 });
    expect(slice.s.userProfile).toEqual({ id: 7, is_phone_verified: 1 });
    expect(slice.s.user).toEqual({ id: 7 });
  });

  it("merges onto an absent profile without throwing", () => {
    const slice = makeSlice();
    slice.s.editUserInfo({ name: "Ada" });
    expect(slice.s.userProfile).toEqual({ name: "Ada" });
  });
});
