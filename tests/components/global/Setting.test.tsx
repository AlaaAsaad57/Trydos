// The settings page wrapper: it shows the settings modal for the page's locale.
import { describe, expect, it, vi } from "vitest";

const modal = vi.hoisted(() => ({ props: null as any }));
vi.mock("components/Home/SettingsModal", () => ({
  default: (props: any) => {
    modal.props = props;
    return <button onClick={props.onClose}>close settings</button>;
  },
}));

import Setting from "components/global/Setting";

import { renderWithProviders, screen, userEvent } from "../../render";

describe("the settings wrapper", () => {
  it("shows the settings modal for the given locale, and its close button works", async () => {
    await renderWithProviders(<Setting lang="sy-ar" />);

    expect(modal.props?.lang, "the settings modal must get the page's locale").toBe("sy-ar");
    await userEvent.click(screen.getByText("close settings"));
    expect(
      screen.getByText("close settings"),
      "closing must not throw or remove the settings page, which is the whole page here",
    ).toBeInTheDocument();
  });
});
