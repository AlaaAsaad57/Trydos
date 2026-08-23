// The number field, and the rules that decide when a number is whole.
//
// Everything here exists to stop a shopper sending a code to a number that
// cannot receive one: the prefix people actually type is stripped, the country
// is read from the dial code, and the send is not offered until the digits add
// up. A number that gets past this costs a real send and a real cooldown to
// find out about.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useState } from "react";

import RdbPhoneInput, {
  normalizeDialInput,
} from "components/Login/Enhanced/ui/RdbPhoneInput";

import { resetDevice, setDevice } from "../../../../mocks/device";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../../render";

type Props = Partial<React.ComponentProps<typeof RdbPhoneInput>>;

function Host({ onChange, ...props }: Props) {
  const [value, setValue] = useState(props.value ?? "");
  return (
    <RdbPhoneInput
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

async function renderInput(props: Props = {}) {
  const user = userEvent.setup();
  const rendered = await renderWithProviders(<Host {...props} />);
  return { ...rendered, user };
}

const field = () =>
  document.querySelector<HTMLInputElement>(
    '[data-pw="input-phone-number-field"]',
  );
const sendButton = () =>
  screen.queryByRole("button", { name: "Send phone number" });
const keypadKey = (digit: string) =>
  screen.queryByRole("button", { name: digit });

/** A whole Syrian number: dial code 963 and nine more. */
const WHOLE = "963991234567";

afterEach(() => {
  resetDevice();
  vi.clearAllMocks();
});

describe("the prefix people actually type", () => {
  it.each([
    ["+963991234567", "the plus most people write"],
    ["00963991234567", "the double zero used across much of the region"],
    ["0963991234567", "the national leading zero"],
    ["963 99 123 45 67", "spaces from a copied number"],
    ["(963) 99-123-4567", "brackets and dashes from a contact card"],
  ])("reads %s (%s) as the same number", (typed) => {
    expect(
      normalizeDialInput(typed),
      `"${typed}" is how somebody really writes this number — read literally ` +
        "it matches no country, and the backend is handed a number with the " +
        "prefix still on it",
    ).toBe(WHOLE);
  });

  it("keeps a number that is already bare digits", () => {
    expect(
      normalizeDialInput(WHOLE),
      "a number that needs nothing done to it must come back unchanged",
    ).toBe(WHOLE);
  });

  it("copes with nothing at all", () => {
    expect(
      normalizeDialInput(""),
      "the field starts empty, and every keystroke runs through here",
    ).toBe("");
  });
});

describe("when the number is whole enough to send", () => {
  beforeEach(() => setDevice("pointer"));

  it("offers no send for a part of a number", async () => {
    const { user } = await renderInput({ onSend: vi.fn() });

    await user.type(field()!, "96399");

    expect(
      sendButton(),
      "sending half a number spends a real send and a real cooldown to be " +
        "told what the screen already knew",
    ).not.toBeInTheDocument();
  });

  it("offers the send once the country's digits are all there", async () => {
    const { user } = await renderInput({ onSend: vi.fn() });

    await user.type(field()!, WHOLE);

    expect(
      sendButton(),
      "the number is complete for its country — holding the send back now " +
        "leaves the shopper with a field that looks broken",
    ).toBeInTheDocument();
  });

  it("takes no more digits than the country has", async () => {
    const { user } = await renderInput();

    await user.type(field()!, `${WHOLE}999`);

    expect(
      field(),
      "extra digits do not make a longer number, they make a wrong one — and " +
        "the shopper cannot see which end was cut",
    ).toHaveValue(WHOLE);
  });

  it("sends on the arrow", async () => {
    const onSend = vi.fn();
    const { user } = await renderInput({ onSend });

    await user.type(field()!, WHOLE);
    await user.click(sendButton()!);

    expect(
      onSend,
      "the arrow is the only control on this screen — if it does nothing, the " +
        "flow stops at its first step",
    ).toHaveBeenCalledTimes(1);
  });

  it("sends on Enter, for somebody typing rather than tapping", async () => {
    const onSend = vi.fn();
    const { user } = await renderInput({ onSend });

    await user.type(field()!, `${WHOLE}{Enter}`);

    expect(
      onSend,
      "a shopper at a keyboard finishes a field with Enter and never looks " +
        "for the arrow",
    ).toHaveBeenCalledTimes(1);
  });

  it("does not send on Enter before the number is whole", async () => {
    const onSend = vi.fn();
    const { user } = await renderInput({ onSend });

    await user.type(field()!, "96399{Enter}");

    expect(
      onSend,
      "the keyboard must not get round the check the arrow enforces",
    ).not.toHaveBeenCalled();
  });

  it("holds the send closed while one is already going out", async () => {
    // Opened with the number already in place, the way the screen re-renders
    // it: a send in flight also closes the field, so it cannot be typed now.
    await renderInput({ value: WHOLE, onSend: vi.fn(), isLoading: true });

    expect(
      sendButton(),
      "a second tap while the first send is in flight is a second code, a " +
        "second cost, and a cooldown the shopper did not choose",
    ).toBeDisabled();
  });
});

describe("what the shopper sees", () => {
  beforeEach(() => setDevice("pointer"));

  it("shows the country the dial code names", async () => {
    const { user } = await renderInput();

    await user.type(field()!, "963");

    await waitFor(() => {
      expect(
        document.querySelector('img[alt="flag"]'),
        "the flag is the shopper's confirmation that the first digits were " +
          "read as they meant them",
      ).toBeInTheDocument();
    });
  });

  it("says what to type while the field is empty", async () => {
    await renderInput({ placeholder: "Enter Your Phone Number" });

    expect(
      screen.getByText("Enter Your Phone Number"),
      "the field is drawn, not native, so an empty one says nothing at all " +
        "without this",
    ).toBeInTheDocument();
  });
});

describe("on a phone", () => {
  beforeEach(() => setDevice("touch"));

  it("uses the app's own keypad", async () => {
    await renderInput();

    expect(
      await screen.findByRole("button", { name: "1" }),
      "the device keyboard opens over the lower half of the screen and hides " +
        "the field being typed into",
    ).toBeInTheDocument();
  });

  it("adds a digit per key", async () => {
    const { user } = await renderInput();
    await screen.findByRole("button", { name: "9" });

    await user.click(keypadKey("9")!);
    await user.click(keypadKey("6")!);
    await user.click(keypadKey("3")!);

    await waitFor(() => {
      expect(
        document.querySelector('img[alt="flag"]'),
        "keys typed on the app's keypad must reach the number the same way " +
          "typed ones do — the country is the proof they did",
      ).toBeInTheDocument();
    });
  });

  it("still offers the send when the number is whole", async () => {
    const { user } = await renderInput({ onSend: vi.fn() });
    await screen.findByRole("button", { name: "9" });

    for (const digit of WHOLE.split("")) {
      await user.click(keypadKey(digit)!);
    }

    expect(
      sendButton(),
      "a phone shopper reaches the same finished number and must get the same " +
        "way forward",
    ).toBeInTheDocument();
  });

  it("takes the device keyboard instead where the keypad would not fit", async () => {
    await renderInput({ disableCustomKeypad: true });

    expect(
      field(),
      "the keypad is fixed to the bottom of the screen, so in the cart's short " +
        "footer panel it would cover the very thing being typed into",
    ).toBeInTheDocument();
    expect(
      keypadKey("1"),
      "and the two must not both be up",
    ).not.toBeInTheDocument();
  });
});
