// The six code boxes, and the two ways a shopper fills them.
//
// On a phone the app draws its own keypad and there is no field; at a desk
// there is a hidden field and the device's keyboard. Both branches ship, and
// each is the only way in on its device — so each is driven here for real
// rather than assumed from the other.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useState } from "react";

import RdbPinInputs from "components/Login/Enhanced/ui/RdbPinInputs";

import { resetDevice, setDevice } from "../../../../mocks/device";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../../render";

type Props = Partial<React.ComponentProps<typeof RdbPinInputs>>;

/** The boxes are controlled by their host, so a stand-in host holds the code. */
function Host({ onChange, ...props }: Props) {
  const [value, setValue] = useState("");
  return (
    <RdbPinInputs
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      onComplete={props.onComplete ?? (() => {})}
      {...props}
    />
  );
}

async function renderBoxes(props: Props = {}) {
  const user = userEvent.setup();
  const rendered = await renderWithProviders(<Host {...props} />);
  return { ...rendered, user };
}

const field = () =>
  document.querySelector<HTMLInputElement>('[data-pw="input-otp-field"]');
const keypadKey = (digit: string) =>
  screen.queryByRole("button", { name: digit });
const backspace = () =>
  document.querySelector<HTMLButtonElement>('[data-pw="keypad-backspace"]');
const boxes = () =>
  Array.from(document.querySelectorAll('[data-pw^="otp-digit-"]')).map(
    (box) => box.textContent,
  );

afterEach(() => {
  resetDevice();
  vi.clearAllMocks();
});

describe("on a phone", () => {
  beforeEach(() => setDevice("touch"));

  it("puts its own keypad up, and no field", async () => {
    await renderBoxes();

    expect(
      await screen.findByRole("button", { name: "1" }),
      "a phone keyboard covers most of the screen and pushes these boxes out " +
        "of sight — the app draws its own so the code stays visible",
    ).toBeInTheDocument();
    expect(
      field(),
      "and there is nothing for the device keyboard to open on, on purpose",
    ).not.toBeInTheDocument();
  });

  it("marks the code row for the scaled canvas to keep above the keypad", async () => {
    // Same contract as the phone box: AppScaler lifts the canvas so the
    // marked row clears the keypad — see tests/scaling/appScaler.test.tsx.
    await renderBoxes();
    await screen.findByRole("button", { name: "1" });

    expect(
      document
        .querySelector("[data-keyboard-anchor]")
        ?.querySelector('[data-pw="otp-digit-1"]'),
      "the code row is not marked data-keyboard-anchor while the keypad is up, so the scaler leaves it under the keypad",
    ).toBeInTheDocument();
  });

  it("fills the boxes in order as keys are pressed", async () => {
    const { user } = await renderBoxes();
    await screen.findByRole("button", { name: "1" });

    await user.click(keypadKey("1")!);
    await user.click(keypadKey("2")!);
    await user.click(keypadKey("3")!);

    expect(
      boxes(),
      "each key must land in the next empty box — out of order, the shopper " +
        "is typing a different code than the one they read",
    ).toEqual(["1", "2", "3", "", "", ""]);
  });

  it("takes the last digit back", async () => {
    const { user } = await renderBoxes();
    await screen.findByRole("button", { name: "1" });
    await user.click(keypadKey("1")!);
    await user.click(keypadKey("2")!);

    await user.click(backspace()!);

    expect(
      boxes(),
      "a mistyped digit must be fixable — without a backspace the shopper's " +
        "only way out is to wait for the code to expire",
    ).toEqual(["1", "", "", "", "", ""]);
  });

  it("submits the code once the sixth digit lands", async () => {
    const onComplete = vi.fn();
    const { user } = await renderBoxes({ onComplete });
    await screen.findByRole("button", { name: "1" });

    for (const digit of ["1", "2", "3", "4", "5", "6"]) {
      await user.click(keypadKey(digit)!);
    }

    await waitFor(() => {
      expect(
        onComplete,
        "the codes are always six digits, so there is no submit button — the " +
          "last digit is the submit",
      ).toHaveBeenCalledWith("123456");
    });
  });

  it("does not submit early", async () => {
    const onComplete = vi.fn();
    const { user } = await renderBoxes({ onComplete });
    await screen.findByRole("button", { name: "1" });

    for (const digit of ["1", "2", "3", "4", "5"]) {
      await user.click(keypadKey(digit)!);
    }

    expect(
      onComplete,
      "five digits is not a code — checking it would spend one of the " +
        "shopper's attempts on nothing",
    ).not.toHaveBeenCalled();
  });

  it("takes the keypad away once the code is accepted", async () => {
    await renderBoxes({ isValidPin: "valid" });

    await waitFor(() => {
      expect(
        keypadKey("1"),
        "the shopper is through — a keypad still covering the screen hides " +
          "whatever they were sent back to",
      ).not.toBeInTheDocument();
    });
  });

  it("takes no more keys while the code is being checked", async () => {
    await renderBoxes({ disabled: true, autoFocus: false });

    expect(
      keypadKey("1"),
      "a seventh digit typed mid-check would start a second check and burn " +
        "another attempt",
    ).not.toBeInTheDocument();
  });
});

describe("at a desk", () => {
  beforeEach(() => setDevice("pointer"));

  it("uses the device's own keyboard", async () => {
    await renderBoxes();

    expect(
      field(),
      "there is a real keyboard here, and a field is what lets the browser " +
        "offer the code it just saw arrive by SMS",
    ).toBeInTheDocument();
    expect(
      keypadKey("1"),
      "and the app's own keypad would be a worse keyboard than the one " +
        "already attached",
    ).not.toBeInTheDocument();
  });

  it("offers the code the browser saw arrive", async () => {
    await renderBoxes();

    expect(
      field(),
      "without this the shopper copies six digits across by hand from a " +
        "notification they can only half see",
    ).toHaveAttribute("autocomplete", "one-time-code");
  });

  it("shows what was typed in the boxes", async () => {
    const { user } = await renderBoxes();

    await user.type(field()!, "1234");

    expect(
      boxes(),
      "the field is invisible, so the boxes are the only feedback that a key " +
        "registered at all",
    ).toEqual(["1", "2", "3", "4", "", ""]);
  });

  it("ignores anything that is not a digit", async () => {
    const { user } = await renderBoxes();

    await user.type(field()!, "12ab34");

    expect(
      boxes(),
      "a pasted code often carries spaces or letters around it — keeping them " +
        "would send the backend a code the shopper never received",
    ).toEqual(["1", "2", "3", "4", "", ""]);
  });

  it("submits as soon as six digits are in", async () => {
    const onComplete = vi.fn();
    const { user } = await renderBoxes({ onComplete });

    await user.type(field()!, "123456");

    expect(
      onComplete,
      "the last digit is the submit here too — a desk shopper must not be " +
        "left looking for a button that does not exist",
    ).toHaveBeenCalledWith("123456");
  });

  it("takes nothing while the code is being checked", async () => {
    await renderBoxes({ disabled: true });

    expect(
      field(),
      "typing on during a check starts a second one and spends an attempt",
    ).toBeDisabled();
  });
});
