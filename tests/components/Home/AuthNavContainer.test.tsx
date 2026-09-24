import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const cookies: Record<string, any> = {
  "User-Data": { name: "Sara" },
  "USER-CHAT": { id: 7 },
  "USER-STORIES": { id: 9 },
  WALLET_USER: null,
};

vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: vi.fn(async (name: string) => cookies[name]),
}));
vi.mock("utils/cookies/cookie-manager", async () => {
  const { makeCookieManagerMock } = await import("../../mocks/cookieManager");
  return makeCookieManagerMock();
});
vi.mock("components/Home/UserNavTopSection", () => ({
  default: ({ initialUserData }: any) => (
    <pre data-testid="nav">{JSON.stringify(initialUserData)}</pre>
  ),
}));

import AuthNavContainer from "components/Home/AuthNavContainer";

describe("AuthNavContainer", () => {
  it("reads the four session cookies on the server and hands them to the navigation", async () => {
    render(await AuthNavContainer());
    const passed = JSON.parse(screen.getByTestId("nav").textContent!);
    expect(passed.userData, "the profile cookie did not reach the navigation").toEqual({ name: "Sara" });
    expect(passed.userChat, "the chat user cookie did not reach the navigation").toEqual({ id: 7 });
    expect(passed.userStories, "the stories user cookie did not reach the navigation").toEqual({ id: 9 });
    expect(passed.userWallet, "an empty wallet cookie should reach the navigation as null").toBeNull();
  });
});
