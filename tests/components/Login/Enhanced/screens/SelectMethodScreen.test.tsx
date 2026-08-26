// The screen that asks how the code should arrive, and the number it is about
// to send to.
//
// The number matters twice over. The shopper reads it to check the code is
// going somewhere they can reach. And the browser suite reads it to know which
// screen is on show — `currentAuthScreen` used to look for the **Edit** button,
// which this screen omits whenever the account already owns the number. On that
// locked screen the helper saw nothing at all and reported "no auth screen",
// which is why the number carries its own marker now: it is the one element
// that renders in both cases.
import { describe, expect, it } from "vitest";

import SelectMethodScreen from "components/Login/Enhanced/screens/SelectMethodScreen";

import { renderWithProviders } from "../../../../render";

const PHONE = "963991234567";

type ScreenProps = Partial<React.ComponentProps<typeof SelectMethodScreen>>;

async function renderScreen(props: ScreenProps = {}) {
  return renderWithProviders(
    <SelectMethodScreen
      setMethod={() => {}}
      phone={PHONE}
      authType="verify"
      {...props}
    />,
  );
}

const methodPhone = () =>
  document.querySelector<HTMLElement>('[data-pw="method-phone"]');

const editButton = () =>
  document.querySelector<HTMLElement>('[data-pw="edit-phone-number"]');

describe("the number the method screen is about to send to", () => {
  it("carries its own marker when the number can be changed", async () => {
    await renderScreen({ changeNumber: () => {} });

    expect(
      methodPhone(),
      "the method screen drew no marked number, so a test cannot read which number the code is going to",
    ).not.toBeNull();
    expect(
      methodPhone()?.textContent,
      "the marked number does not carry the number the screen was given",
    ).toContain(PHONE);
  });

  it("carries the same marker when the number is locked and Edit is gone", async () => {
    await renderScreen({ changeNumber: undefined });

    expect(
      editButton(),
      "the Edit control was drawn on a locked number, which lets the shopper swap a number the account already owns",
    ).toBeNull();
    expect(
      methodPhone(),
      "the locked method screen drew no marked number, so nothing on it identifies the screen once Edit is gone",
    ).not.toBeNull();
    expect(
      methodPhone()?.textContent,
      "the locked screen's marked number does not carry the number the screen was given",
    ).toContain(PHONE);
  });
});
