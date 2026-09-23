import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_NAV_THEME } from "components/NavigationDemo/BottomNav";
import NavControls from "components/NavigationDemo/NavControls";

const open = (onChange = vi.fn(), theme = DEFAULT_NAV_THEME) => {
  render(<NavControls theme={theme} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Style" }));
  return onChange;
};

const sliders = () => screen.getAllByRole("slider");

describe("NavControls", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens from the Style chip and closes again", () => {
    open();
    expect(screen.getByText("Bar style"), "the panel did not open").toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide the style panel" }));
    expect(screen.getByRole("button", { name: "Style" }), "the panel did not close").toBeInTheDocument();
  });

  it("sends every changed value back with the rest of the theme kept", () => {
    const onChange = open();
    const keys = ["blur", "saturation", "opacity", "minScale", "distance", "speedEffect"] as const;
    const values = ["20", "100", "0.5", "0.8", "400", "1.5"];
    sliders().forEach((slider, i) => {
      fireEvent.change(slider, { target: { value: values[i] } });
      expect(
        onChange.mock.lastCall?.[0],
        `moving the ${keys[i]} slider did not send ${keys[i]}=${values[i]}`,
      ).toEqual({ ...DEFAULT_NAV_THEME, [keys[i]]: Number(values[i]) });
    });
    fireEvent.change(screen.getByLabelText("Bar colour"), { target: { value: "#112233" } });
    expect(onChange.mock.lastCall?.[0].color, "the colour picker did not send the colour").toBe("#112233");
    fireEvent.change(screen.getByLabelText("Bar colour as a hex value"), { target: { value: "#abc" } });
    expect(onChange.mock.lastCall?.[0].color, "the hex box did not send the colour").toBe("#abc");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onChange.mock.lastCall?.[0], "Reset did not send the measured theme").toBe(DEFAULT_NAV_THEME);
  });

  it("copies the CSS, says so, and goes back to the label after a moment", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    open();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy CSS" }));
    });
    expect(writeText, "the copied text is not the CSS on screen").toHaveBeenCalledWith(
      "backdrop-filter: blur(15px) saturate(180%);\nbackground: rgba(246,246,246,0.84);",
    );
    expect(screen.getByRole("button", { name: "Copied" }), "the button did not confirm the copy").toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1400));
    expect(screen.getByRole("button", { name: "Copy CSS" }), "the button kept saying Copied").toBeInTheDocument();
  });

  it("stays quiet when the clipboard is refused", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn(async () => { throw new Error("denied"); }) } });
    open();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy CSS" }));
    });
    expect(screen.getByRole("button", { name: "Copy CSS" }), "a refused copy still said Copied").toBeInTheDocument();
  });
});
