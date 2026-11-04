import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "store";
import { canAddStory, startAddStory } from "components/DemoApp1/addStory";

const spies = {
  setLoginOpen: vi.fn(),
  setAddStory: vi.fn(),
  setNameModal: vi.fn(),
  setShouldAuthinticated: vi.fn(),
};

const shopper = (extra: Record<string, unknown> = {}) =>
  useAppStore.setState({
    ...spies,
    storiesRefreshing: false,
    user: null,
    userProfile: { phone: "963900000000", name: "Rana", ...extra },
    userStories: { id: 5, access_token: "x" },
  } as any);

describe("canAddStory (who sees the add-story card)", () => {
  it("is true when the core backend allows the shopper to post stories (1)", () => {
    expect(canAddStory({ is_allowed_to_upload_story: 1 }), "1 must allow the card").toBe(true);
  });

  it("is true for the text '1'", () => {
    expect(canAddStory({ is_allowed_to_upload_story: "1" }), "'1' must allow the card").toBe(true);
  });

  it("is true for true", () => {
    expect(canAddStory({ is_allowed_to_upload_story: true }), "true must allow the card").toBe(true);
  });

  it("is false for 0", () => {
    expect(canAddStory({ is_allowed_to_upload_story: 0 }), "0 must hide the card").toBe(false);
  });

  it("is false with no profile (a guest)", () => {
    expect(canAddStory(null), "a guest with no profile must not see the card").toBe(false);
  });
});

describe("startAddStory (a tap on the add-story card)", () => {
  beforeEach(() => {
    Object.values(spies).forEach((s) => s.mockReset());
  });

  it("opens the add-story sheet for a signed-in shopper with a name", () => {
    shopper();
    startAddStory();
    expect(spies.setAddStory, "the add-story sheet did not open").toHaveBeenCalledWith(true);
  });

  it("sends a shopper with no phone to the login", () => {
    shopper({ phone: "0" });
    startAddStory();
    expect(spies.setLoginOpen, "a shopper with the guest phone '0' must go to the login").toHaveBeenCalledWith(true);
  });

  it("asks for a name first when the shopper has none", () => {
    shopper({ name: "" });
    startAddStory();
    expect(spies.setNameModal, "a shopper with no name must get the name prompt").toHaveBeenCalledWith(true);
  });

  it("asks for the phone re-verify when the stories session needs a new sign-in", () => {
    shopper();
    useAppStore.setState({ userStories: { id: 5, need_auth: true } } as any);
    startAddStory();
    expect(
      spies.setShouldAuthinticated,
      "a stories session that needs a sign-in must open the phone re-verify",
    ).toHaveBeenCalledWith("open Story");
  });

  it("does nothing while a story uploads", () => {
    shopper();
    useAppStore.setState({ storiesRefreshing: true } as any);
    startAddStory();
    expect(spies.setAddStory, "a tap during an upload must do nothing").not.toHaveBeenCalled();
  });
});
