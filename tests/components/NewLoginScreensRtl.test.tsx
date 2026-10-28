// The new login screens on an Arabic page (Stage 2 of UI-MIGRATION-PLAN.md):
// mirrored (D-3, A-13), with numbers that stay left to right (A-30) and a
// mirrored arrow (A-14).
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("scaling/Page", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import NewAlreadyExistScreen from "NewLoginDesign/NewAlreadyExistScreen";
import NewEnterPhoneScreen from "NewLoginDesign/NewEnterPhoneScreen";
import NewEnterPinScreen from "NewLoginDesign/NewEnterPinScreen";
import NewGetStartedScreen from "NewLoginDesign/NewGetStartedScreen";
import NewInputNameScreen from "NewLoginDesign/NewInputNameScreen";
import NewNotFoundScreen from "NewLoginDesign/NewNotFoundScreen";
import NewSelectMethodScreen from "NewLoginDesign/NewSelectMethodScreen";
import NewSessionExpiredScreen from "NewLoginDesign/NewSessionExpiredScreen";
import NewSuccessScreen from "NewLoginDesign/NewSuccessScreen";
import NewTermsScreen from "NewLoginDesign/NewTermsScreen";
import { renderWithProviders, userEvent } from "../render";

const PHONE = "963991234567";
const noop = () => {};

/** Opens a screen on /sy-ar, the page every login screen is drawn on in Arabic. */
const onArabicPage = (ui: React.ReactElement) =>
  renderWithProviders(<div dir="rtl">{ui}</div>, { language: "ar", country: "sy" });

/**
 * Every element placed by the physical left or right. Such an element stays
 * where it is on a right-to-left page, so the screen is not mirrored there.
 * Inside a box that is left to right on purpose (A-30) left is left, so those
 * boxes are not searched.
 */
const physicalSides = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>("*")]
    .filter((el) => !el.closest('[dir="ltr"]'))
    .flatMap((el) => {
      const style = el.getAttribute("style") ?? "";
      return (style.match(/(^|;\s*)(left|right)\s*:[^;]*/g) ?? []).map(
        (found) => `${el.tagName.toLowerCase()}${el.dataset.pw ? `[${el.dataset.pw}]` : ""} ${found.replace(/^;\s*/, "").trim()}`,
      );
    });

describe("the new login screens on an Arabic page", () => {
  it.each<[string, React.ReactElement]>([
    ["Get Started", <NewGetStartedScreen key="g" onExistingAccount={noop} onNewCustomer={noop} onLater={noop} onScanQr={noop} lang="ar" />],
    ["Terms", <NewTermsScreen key="t" onAgree={noop} onLater={noop} lang="ar" />],
    ["phone", <NewEnterPhoneScreen key="p" authType="signIn" phone={PHONE} setPhone={noop} onSubmit={noop} onClose={noop} lang="ar" />],
    ["method", <NewSelectMethodScreen key="m" authType="signIn" phone={PHONE} setMethod={noop} changeNumber={noop} onClose={noop} lang="ar" />],
    ["code", <NewEnterPinScreen key="c" phone={PHONE} pin="" setPin={noop} onSubmit={noop} onResend={noop} changeMethod={noop} changeNumber={noop} onClose={noop} lang="ar" />],
    ["not registered", <NewNotFoundScreen key="n" phone={PHONE} onCreateAccount={noop} onCancel={noop} onClose={noop} lang="ar" />],
    ["already registered", <NewAlreadyExistScreen key="a" phone={PHONE} onLogIn={noop} onCancel={noop} onClose={noop} lang="ar" />],
    ["name", <NewInputNameScreen key="i" name="رنا" setName={noop} onSubmit={noop} lang="ar" />],
    ["success", <NewSuccessScreen key="s" variant="signup" lang="ar" />],
    ["session expired", <NewSessionExpiredScreen key="e" onLogin={noop} onContinueAsGuest={noop} lang="ar" />],
  ])("the %s screen places nothing by the physical left or right", async (_name, screen) => {
    const { container } = await onArabicPage(screen);
    expect(physicalSides(container), "these stay on the left on an Arabic page, so the screen is not mirrored").toEqual([]);
  });

  it.each<[string, React.ReactElement, string]>([
    ["method", <NewSelectMethodScreen key="m" authType="signIn" phone={PHONE} setMethod={noop} onClose={noop} lang="ar" />, "+963 991 234 567"],
    ["code", <NewEnterPinScreen key="c" phone={PHONE} pin="" setPin={noop} onSubmit={noop} lang="ar" />, "+963 991 234 567"],
    ["not registered", <NewNotFoundScreen key="n" phone={PHONE} onCreateAccount={noop} onCancel={noop} lang="ar" />, "+963 991 234 567"],
    ["already registered", <NewAlreadyExistScreen key="a" phone={PHONE} onLogIn={noop} onCancel={noop} lang="ar" />, "+963 991 234 567"],
  ])("the %s screen shows the number left to right (A-30)", async (name, screen, shown) => {
    const { container } = await onArabicPage(screen);
    const number = [...container.querySelectorAll<HTMLElement>("*")].find(
      (el) => el.children.length === 0 && el.textContent === shown,
    );
    expect(number, `the ${name} screen does not show the number ${shown}`).toBeDefined();
    expect(
      number!.closest("[dir]")?.getAttribute("dir"),
      `the number on the ${name} screen is not left to right, so its groups come out in reverse order`,
    ).toBe("ltr");
  });

  it("keeps the phone box and the code boxes left to right (A-30)", async () => {
    const { container: phone } = await onArabicPage(
      <NewEnterPhoneScreen authType="signIn" phone="" setPhone={noop} onSubmit={noop} lang="ar" />,
    );
    expect(
      phone.querySelector('[data-pw="phone-number-display"]')?.closest("[dir]")?.getAttribute("dir"),
      "the phone box is mirrored on an Arabic page",
    ).toBe("ltr");

    const { container: code } = await onArabicPage(
      <NewEnterPinScreen phone={PHONE} pin="" setPin={noop} onSubmit={noop} lang="ar" />,
    );
    expect(
      // The drawn boxes; the hidden field typed into sits beside their row.
      code.querySelector('[data-pw="otp-digit-1"]')?.closest("[dir]")?.getAttribute("dir"),
      "the code boxes are mirrored on an Arabic page, so the first digit lands on the right",
    ).toBe("ltr");
  });

  it("turns the name screen's continue arrow to point the other way (A-14)", async () => {
    const user = userEvent.setup();
    const { container } = await onArabicPage(<NewInputNameScreen onSubmit={noop} lang="ar" />);
    await user.type(container.querySelector<HTMLInputElement>('[data-pw="input-user-name-field"]')!, "رنا");
    const arrow = container.querySelector<HTMLElement>('[data-pw="submit-user-name"] img');
    expect(arrow, "the name screen shows no continue arrow after a name is typed").not.toBeNull();
    expect(arrow!.style.transform, "the continue arrow still points right on an Arabic page").toBe("scaleX(-1)");
  });
});
