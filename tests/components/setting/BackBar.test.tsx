// The top bar of every settings screen (components/setting/BackBar.tsx).
//
// The back arrow asks the parent first (`onBackIntercept`), then goes back in
// history when there is one, then to `preivous_page` or the locale home. The
// right side shows Save (guarded by `validateFunction`) and the options icon.
import { afterEach, describe, expect, it, vi } from "vitest";

import BackBar from "components/setting/BackBar";
import { routerSpies } from "../../mocks/nextNavigation";
import { renderWithProviders, screen, userEvent } from "../../render";

const back = () =>
  document.querySelector('[data-pw="Back-Button-Icon-back-button"]') as HTMLElement;

afterEach(() => vi.clearAllMocks());

describe("the back arrow", () => {
  it("does nothing more when the parent handles the back", async () => {
    const onBackIntercept = vi.fn(() => true);
    await renderWithProviders(
      <BackBar local="gb-en" isRtl={false} onBackIntercept={onBackIntercept} />,
    );
    await userEvent.setup().click(back());
    expect(onBackIntercept, "the parent was not asked first").toHaveBeenCalled();
    expect(routerSpies.push, "the bar navigated although the parent handled the back").not.toHaveBeenCalled();
    expect(routerSpies.back, "the bar went back although the parent handled the back").not.toHaveBeenCalled();
  });

  it("goes back in history and to the previous page, and ignores a second tap", async () => {
    const screenEl = document.createElement("div");
    screenEl.className = "setting-screen";
    document.body.appendChild(screenEl);
    await renderWithProviders(
      <BackBar
        local="gb-ar"
        isRtl
        preivous_page="/gb-ar/settings"
        onBackIntercept={() => false}
      />,
      { store: { lastPathname: "/gb-ar/settings" }, language: "ar" },
    );
    const user = userEvent.setup();
    await user.click(back());
    expect(routerSpies.back, "the bar did not go back in history").toHaveBeenCalled();
    expect(routerSpies.push, "the bar did not open the previous page").toHaveBeenCalledWith("/gb-ar/settings");
    expect(screenEl.classList.contains("loading-page-class"), "the screen was not marked as leaving").toBe(true);
    expect(back().parentElement!.style.direction, "the bar is not right-to-left in Arabic").toBe("rtl");

    await user.click(back());
    expect(routerSpies.push, "a second tap navigated again").toHaveBeenCalledTimes(1);
    screenEl.remove();
  });

  it("goes to the locale home from the settings root or with no history", async () => {
    await renderWithProviders(<BackBar local="gb-en" isRtl={false} />, {
      path: "/settings",
    });
    await userEvent.setup().click(back());
    expect(routerSpies.push, "the settings root did not go to the locale home").toHaveBeenCalledWith("/gb-en");
  });

  it("stays put on a deeper page when there is history but no previous page", async () => {
    await renderWithProviders(<BackBar local="gb-en" isRtl={false} />, {
      path: "/settings/profile",
      store: { lastPathname: "/gb-en/settings" },
    });
    await userEvent.setup().click(back());
    expect(routerSpies.back, "the bar did not go back in history").toHaveBeenCalled();
    expect(routerSpies.push, "the bar pushed a page as well as going back").not.toHaveBeenCalled();
  });
});

describe("the right side", () => {
  it("shows the title, icon and options, and the options icon calls back", async () => {
    const options = vi.fn();
    await renderWithProviders(
      <BackBar local="gb-en" isRtl={false} name="Orders" Icon="/icons/x.svg" options={options} DataCy="" />,
    );
    expect(screen.getByText("Orders"), "the title is not shown").toBeInTheDocument();
    expect(document.querySelector('img[src="/icons/x.svg"]'), "the title icon is not shown").not.toBeNull();
    expect(document.querySelector('[data-pw="back-button"]'), "an empty DataCy did not fall back to the default name").not.toBeNull();
    await userEvent.setup().click(document.querySelector('[data-pw="screen-options-button"]')!);
    expect(options, "the options icon did not call back").toHaveBeenCalled();
  });

  it("saves only when the check passes", async () => {
    const Save = vi.fn();
    let valid = false;
    await renderWithProviders(
      <BackBar local="gb-en" isRtl={false} Save={Save} validateFunction={() => valid} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByText("Save"));
    expect(Save, "Save ran although the check failed").not.toHaveBeenCalled();
    valid = true;
    await user.click(screen.getByText("Save"));
    expect(Save, "Save did not run once the check passed").toHaveBeenCalledTimes(1);
  });

  it("does nothing on a tap with no Save", async () => {
    await renderWithProviders(<BackBar local="gb-en" isRtl={false} />);
    await userEvent.setup().click(document.querySelector('[data-pw="Back-Button-Icon"]')!);
    expect(routerSpies.push, "tapping the empty right side navigated").not.toHaveBeenCalled();
  });
});
