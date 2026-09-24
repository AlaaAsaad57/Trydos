// The settings top bar used by the address form (components/settings/TopBar.tsx).
//
// Back arrow, a title (translated when it is text), Save guarded by a check,
// and an options icon that scrolls the order details to the top and opens
// the order options.
import { afterEach, describe, expect, it, vi } from "vitest";

import SettingTopBar from "components/settings/TopBar";
import { renderWithProviders, screen, userEvent } from "../../render";

afterEach(() => vi.clearAllMocks());

describe("the settings top bar", () => {
  it("goes back, shows a text title, and saves only when the check passes", async () => {
    const goBack = vi.fn();
    const Save = vi.fn();
    let valid = false;
    await renderWithProviders(
      <SettingTopBar goBack={goBack} screenName="Profile" Save={Save} validateFunction={() => valid} />,
    );
    const user = userEvent.setup();
    await user.click(document.querySelector('[data-pw="back-button"]')!);
    expect(goBack, "the back arrow did not go back").toHaveBeenCalled();
    expect(screen.getByText("Profile"), "the text title is not shown").toBeInTheDocument();

    await user.click(screen.getByText("Save"));
    expect(Save, "Save ran although the check failed").not.toHaveBeenCalled();
    valid = true;
    await user.click(screen.getByText("Save"));
    expect(Save, "Save did not run once the check passed").toHaveBeenCalledTimes(1);
  });

  it("shows an element title and icon, right-to-left in Arabic, and does nothing on an empty save tap", async () => {
    await renderWithProviders(
      <SettingTopBar
        goBack={vi.fn()}
        DataCy="x"
        screenName={<b>Bold title</b>}
        Icon={<i>icon</i>}
      />,
      { language: "ar" },
    );
    expect(screen.getByText("Bold title"), "an element title is not shown").toBeInTheDocument();
    expect(screen.getByText("icon"), "the icon is not shown").toBeInTheDocument();
    const back = document.querySelector('[data-pw="x-back-button"]') as HTMLElement;
    expect(back.parentElement!.style.direction, "the bar is not right-to-left in Arabic").toBe("rtl");
    await userEvent.setup().click(document.querySelector('[data-pw="x"]')!);
  });

  it("the options icon scrolls the order details to the top, locks its scroll and opens the options", async () => {
    const setOrderOptions = vi.fn();
    const details = document.createElement("div");
    details.id = "OrderDetails";
    details.className = "overflow-auto";
    details.scrollTop = 40;
    document.body.appendChild(details);
    await renderWithProviders(
      <SettingTopBar goBack={vi.fn()} hasOptions screenName="Order" />,
      { store: { setOrderOptions } },
    );
    await userEvent.setup().click(document.querySelector('img[src="/icons/OptionsIcon.svg"]')!);
    expect(setOrderOptions, "the options icon did not open the order options").toHaveBeenCalledWith(true);
    expect(details.scrollTop, "the order details were not scrolled to the top").toBe(0);
    expect(details.className, "the order details scroll was not locked").toBe("overflow-hidden");
    details.remove();
  });
});
