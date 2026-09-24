import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, options: any) => {
    const Dyn = () => {
      loader();
      return options.loading();
    };
    return Dyn;
  },
}));
vi.mock("components/Home/Stories/NewStories", () => ({ default: () => null }));
vi.mock("components/skeleton/StoryViewerSkeleton", () => ({
  default: () => <div data-testid="stories" />,
}));
vi.mock("components/Home/InitFunction", () => ({ default: () => null }));
vi.mock("components/Home/AuthSections", () => ({ default: () => null }));
vi.mock("components/Login/ConfirmMobilePhoneWidget", () => ({
  default: () => <div data-testid="confirm-phone" />,
}));
vi.mock("components/Login/SessionExpiredWidget", () => ({
  default: () => <div data-testid="session-expired" />,
}));

import NavbarClient from "components/Home/NavbarClient";

describe("NavbarClient", () => {
  it("shows the session-expired prompt when the session is marked expired", async () => {
    await renderWithProviders(<NavbarClient />, {
      store: { loginOpen: false, shouldAuthinticated: "expired", LoggingOut: false },
    });
    expect(screen.getByTestId("session-expired"), "the expired prompt is missing").toBeInTheDocument();
    expect(screen.queryByTestId("confirm-phone"), "the phone check showed next to the expired prompt").toBeNull();
  });

  it("shows the phone check when a re-check is asked for, and opens a selected story", async () => {
    await renderWithProviders(<NavbarClient />, {
      store: {
        loginOpen: false,
        shouldAuthinticated: true,
        LoggingOut: false,
        selectedStory: { id: 3 },
        isProductPage: false,
      },
    });
    expect(screen.getByTestId("confirm-phone"), "the phone check is missing").toBeInTheDocument();
    expect(screen.getByTestId("stories"), "the selected story did not open").toBeInTheDocument();
  });

  it("shows neither prompt while the login widget is open, and no story on a product page", async () => {
    await renderWithProviders(<NavbarClient />, {
      store: {
        loginOpen: true,
        shouldAuthinticated: true,
        selectedStory: { id: 3 },
        isProductPage: true,
      },
    });
    expect(screen.queryByTestId("confirm-phone"), "the phone check showed over the login widget").toBeNull();
    expect(screen.queryByTestId("stories"), "the home story viewer opened on a product page").toBeNull();
  });
});
