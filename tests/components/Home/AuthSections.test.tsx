import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

// next/dynamic is replaced by a stand-in that starts the real loader (so the
// import line runs) and shows the loading screen, which is what a shopper sees
// first.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, options: any) => {
    const Dyn = () => {
      loader();
      return options.loading();
    };
    return Dyn;
  },
}));
vi.mock("components/Chat/pages/CallContainer", () => ({ default: () => null }));
vi.mock("components/Chat/ChatModal", () => ({ default: () => null }));
vi.mock("components/Login/Enhanced/FullEnhancedLoginWidget", () => ({
  default: () => <div data-testid="login" />,
}));

import AuthSections from "components/Home/AuthSections";

describe("AuthSections", () => {
  it("shows nothing when chat, login and call are all closed", async () => {
    const { container } = await renderWithProviders(<AuthSections />, {
      store: { loginOpen: false, chatVar: false, call: null },
    });
    expect(container.innerHTML, "a closed section was drawn").toBe("");
  });

  it("shows the chat and call loaders and the login widget when each is open", async () => {
    const { container } = await renderWithProviders(<AuthSections />, {
      store: { loginOpen: true, chatVar: true, call: { id: 1 } },
    });
    expect(screen.getByTestId("login"), "the login widget is missing").toBeInTheDocument();
    expect(
      container.querySelectorAll("#landing").length,
      "the chat and the call should each show a loading panel",
    ).toBe(2);
  });
});
