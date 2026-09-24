// The small centred popup with a title and a row of option buttons.
import { describe, expect, it, vi } from "vitest";

const scroll = vi.hoisted(() => ({ disable: vi.fn(), enable: vi.fn() }));
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  DisableScroll: scroll.disable,
  EnableScroll: scroll.enable,
}));

import CustomPopup from "components/global/Popup";

import { fireEvent, renderWithProviders, screen, userEvent } from "../../render";

const setup = async () => {
  const close = vi.fn();
  const pick = vi.fn();
  const result = await renderWithProviders(
    <CustomPopup
      modalTitle="Choose"
      close={close}
      options={[{ render: () => <span>Camera</span>, onClick: pick }]}
    />,
  );
  return { close, pick, ...result };
};

describe("the custom popup", () => {
  it("locks the page scroll while open and unlocks it when closed", async () => {
    const { unmount } = await setup();
    expect(scroll.disable, "the page behind the popup must not scroll while it is open").toHaveBeenCalled();
    unmount();
    expect(scroll.enable, "the page scroll must come back after the popup closes").toHaveBeenCalled();
  });

  it("runs the option and closes when an option is picked", async () => {
    const { close, pick } = await setup();
    await userEvent.click(screen.getByText("Camera"));
    expect(pick, "the picked option's action did not run").toHaveBeenCalled();
    expect(close, "the popup must close after an option is picked").toHaveBeenCalled();
  });

  it("closes on Escape and on a click outside, but not on a click inside", async () => {
    const { close } = await setup();

    await userEvent.click(screen.getByText("Choose"));
    expect(close, "a click inside the popup box must not close it").not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Enter" });
    expect(close, "a key other than Escape must not close the popup").not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(close, "Escape must close the popup").toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("dialog"));
    expect(close, "a click on the dark backdrop must close the popup").toHaveBeenCalledTimes(2);
  });
});
