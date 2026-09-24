import { act, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

import AddStory from "components/Home/AddStory";

const button = () => document.querySelector('[data-pw="Add-Story-Button"]') as HTMLElement | null;

const spies = () => ({
  setNameModal: vi.fn(),
  setAddStory: vi.fn(),
  setShouldAuthinticated: vi.fn(),
  setLoginOpen: vi.fn(),
});

const allowed = (extra: any = {}) => ({ is_allowed_to_upload_story: 1, phone: "0999123", name: "Sara", ...extra });

describe("AddStory", () => {
  it.each([
    ["not set", undefined],
    ["null", null],
    ["0", 0],
    ["false", false],
  ])("hides the button when upload permission is %s", async (_n, value) => {
    await renderWithProviders(<AddStory />, { store: { userProfile: { is_allowed_to_upload_story: value } } });
    expect(button(), "the add-story button showed without permission").toBeNull();
  });

  it.each([
    ["1", 1],
    ["'1'", "1"],
    ["true", true],
  ])("shows the button when upload permission is %s", async (_n, value) => {
    await renderWithProviders(<AddStory />, { store: { userProfile: { is_allowed_to_upload_story: value } } });
    expect(button(), "the add-story button is missing with permission").not.toBeNull();
  });

  it("shows a spinner and ignores taps while the stories are refreshing", async () => {
    const s = spies();
    await renderWithProviders(<AddStory />, { store: { ...s, userProfile: allowed(), storiesRefreshing: true } });
    expect(button()!.querySelector('img[src="/icons/chatplus.svg"]'), "the plus icon showed while refreshing").toBeNull();
    fireEvent.click(button()!);
    expect(s.setAddStory, "a tap during a refresh opened the sheet").not.toHaveBeenCalled();
    expect(s.setLoginOpen, "a tap during a refresh opened the login").not.toHaveBeenCalled();
  });

  it.each([
    ["phone 0", "0"],
    ["numeric phone 0", 0],
    ["no phone", null],
    ["a blank phone", "  "],
    ["a too-short phone", "12"],
  ])("opens the login for %s", async (_n, phone) => {
    const s = spies();
    await renderWithProviders(<AddStory />, { store: { ...s, userProfile: allowed({ phone }) } });
    fireEvent.click(button()!);
    expect(s.setLoginOpen, "the login did not open").toHaveBeenCalledWith(true);
  });

  it("opens the add-story sheet for a named stories user", async () => {
    const s = spies();
    await renderWithProviders(<AddStory />, { store: { ...s, userProfile: allowed(), userStories: { id: 1 } } });
    fireEvent.click(button()!);
    expect(s.setAddStory, "the add-story sheet did not open").toHaveBeenCalledWith(true);
  });

  it.each([
    ["no name", ""],
    ["a guest name", "guest"],
  ])("asks a stories user with %s for a name first", async (_n, name) => {
    const s = spies();
    await renderWithProviders(<AddStory />, { store: { ...s, userProfile: allowed({ name }), userStories: { id: 1 } } });
    fireEvent.click(button()!);
    expect(s.setNameModal, "the name prompt did not open").toHaveBeenCalledWith(true);
    expect(s.setAddStory, "the sheet opened without a name").not.toHaveBeenCalled();
  });

  it("asks for a phone check when the stories account needs one", async () => {
    const s = spies();
    await renderWithProviders(<AddStory />, { store: { ...s, userProfile: allowed(), userStories: { id: 1, need_auth: true } } });
    fireEvent.click(button()!);
    expect(s.setShouldAuthinticated, "the phone check did not open").toHaveBeenCalledWith("open Story");
  });

  it("asks for a phone check when there is no stories account", async () => {
    const s = spies();
    await renderWithProviders(<AddStory />, { store: { ...s, userProfile: allowed(), userStories: null } });
    fireEvent.click(button()!);
    expect(s.setShouldAuthinticated, "the phone check did not open").toHaveBeenCalledWith("open Story");
  });

  it("falls back to the market user when the profile is gone at the moment of the tap", async () => {
    const s = spies();
    const { store } = await renderWithProviders(<AddStory />, {
      store: { ...s, userProfile: allowed(), user: { phone: "0999123", name: "Sara" }, userStories: { id: 1 } },
    });
    // The tap and the profile going away land in one batch, so the button is
    // still on screen while the handler reads the store.
    act(() => {
      store.setState({ userProfile: null } as any);
      fireEvent.click(button()!);
    });
    expect(s.setAddStory, "the market user was not used when the profile was gone").toHaveBeenCalledWith(true);
  });
});
