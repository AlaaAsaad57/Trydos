import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

// The hook merges the server cookies with the store and /api/auth/me; that is
// its own unit. Here it hands back what the server read.
vi.mock("hooks/useUserData", () => ({
  useUserData: ({ initialUserData }: any) => initialUserData,
}));
vi.mock("components/Home/AuthNavSection", () => ({
  default: ({ onClick }: any) => (
    <button data-testid="auth-nav" onClick={onClick}>
      auth
    </button>
  ),
}));
vi.mock("components/Home/Menu", () => ({
  default: ({ isRtl }: any) => <div data-testid="menu" data-rtl={String(isRtl)} />,
}));

import UserNavTopSection from "components/Home/UserNavTopSection";

const data = (userData: any, chat: any = null, stories: any = null) => ({
  userData,
  userChat: chat,
  userStories: stories,
  userWallet: null,
});

describe("UserNavTopSection", () => {
  it("greets a guest, opens the login and the menu, and opens the cart", async () => {
    const setLoginOpen = vi.fn();
    const enableCart = vi.fn();
    const disableAddToCartOption = vi.fn();
    const { container } = await renderWithProviders(<UserNavTopSection initialUserData={data(null)} />, {
      store: { setLoginOpen, enableCart, disableAddToCartOption, localCart: [], loginOpen: false },
    });
    expect(screen.getByText("Welcome"), "a guest is not welcomed").toBeInTheDocument();
    expect(screen.getByText("Why We Know You ?"), "the closed-login question is wrong").toBeInTheDocument();
    expect(container.querySelector('[data-pw="cart-item-counts"]'), "an empty cart shows a count").toBeNull();

    fireEvent.click(container.querySelector('[data-pw="login-icon"]')!);
    expect(setLoginOpen, "Login did not open the login").toHaveBeenCalledWith(true);

    fireEvent.click(container.querySelector('[data-pw="cart_icon_button"]')!);
    expect(disableAddToCartOption, "the add-to-cart option stayed on when opening the cart").toHaveBeenCalled();
    expect(enableCart, "the cart did not open").toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByAltText("user-icon"));
    expect(screen.getByTestId("menu").dataset.rtl, "an English menu must be left to right").toBe("false");
    fireEvent.click(screen.getByAltText("user-icon"));
    expect(screen.queryByTestId("menu"), "a second tap did not close the menu").toBeNull();
  });

  it("treats a phone of 0 as a guest and asks 'Can We Know You ?' while the login is open", async () => {
    await renderWithProviders(<UserNavTopSection initialUserData={data({ id: 1, phone: "0" })} />, {
      store: { loginOpen: true, localCart: [{ id: 1 }, { id: 2 }] },
    });
    expect(screen.getByText("Can We Know You ?"), "the open-login question is wrong").toBeInTheDocument();
    expect(screen.getByText("2"), "the cart count is wrong").toBeInTheDocument();
  });

  it("asks a signed-in shopper without chat and stories accounts to verify the phone", async () => {
    const setShouldAuthinticated = vi.fn();
    const { container } = await renderWithProviders(
      <UserNavTopSection initialUserData={data({ id: 1, phone: "0999" })} />,
      { store: { setShouldAuthinticated }, language: "ar" },
    );
    expect(screen.getByTestId("auth-nav"), "a signed-in shopper did not get the signed-in section").toBeInTheDocument();
    fireEvent.click(container.querySelector('[data-pw="login-icon"]')!);
    expect(setShouldAuthinticated, "Verify did not start the phone check").toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByTestId("auth-nav"));
    expect(screen.getByTestId("menu").dataset.rtl, "an Arabic menu must be right to left").toBe("true");
  });

  it("shows no Verify button when a signed-in shopper has no phone", async () => {
    const { container } = await renderWithProviders(<UserNavTopSection initialUserData={data({ id: 1 })} />);
    expect(container.querySelector('[data-pw="login-icon"]'), "Verify showed without a phone").toBeNull();
  });

  it("shows neither Login nor Verify for a fully signed-in shopper", async () => {
    const { container } = await renderWithProviders(
      <UserNavTopSection initialUserData={data({ id: 1, phone: "0999" }, { id: 2 }, { id: 3 })} />,
    );
    expect(container.querySelector('[data-pw="login-icon"]'), "a fully signed-in shopper saw Login or Verify").toBeNull();
    expect(screen.queryByText("Welcome"), "a signed-in shopper was welcomed as a guest").toBeNull();
  });
});
