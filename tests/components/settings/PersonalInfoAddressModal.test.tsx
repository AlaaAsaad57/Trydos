// The address form wrapper in the profile settings
// (components/settings/PersonalInfoAddressModal.tsx).
//
// It shows the top bar and, while an address is being edited, the address
// form. The form can open the region picker. The form and the picker are
// stubbed with their callbacks exposed as buttons.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("components/Cart/AddAddressForm", () => ({
  default: ({ setOpenSelect, slidePrev, setAddressDetails }: any) => (
    <div data-testid="add-address-form">
      <button onClick={setOpenSelect}>open region</button>
      <button onClick={() => slidePrev(0)}>form done</button>
      <button onClick={() => setAddressDetails({ id: 3 })}>form details</button>
    </div>
  ),
}));

vi.mock("components/Cart/SelectRegion", () => ({
  default: ({ closeSelect }: any) => (
    <div data-testid="select-region">
      <button onClick={closeSelect}>close region</button>
    </div>
  ),
}));

import PersonalInfoAddressModal from "components/settings/PersonalInfoAddressModal";
import { renderWithProviders, screen, userEvent } from "../../render";

afterEach(() => vi.clearAllMocks());

describe("the address form wrapper", () => {
  it("shows only the top bar when no address is being edited, and its back arrow goes back", async () => {
    const goBack = vi.fn();
    await renderWithProviders(<PersonalInfoAddressModal goBack={goBack} />, {
      store: { isActiveAddress: false },
    });
    expect(screen.queryByTestId("add-address-form"), "the form showed with no address being edited").not.toBeInTheDocument();
    await userEvent.setup().click(document.querySelector('[data-pw="profile-info-screen-back-button"]')!);
    expect(goBack, "the top bar back arrow did not go back").toHaveBeenCalled();
  });

  it("shows the form, opens and closes the region picker, and passes details and done through", async () => {
    const goBack = vi.fn();
    const setAddressDetails = vi.fn();
    await renderWithProviders(<PersonalInfoAddressModal goBack={goBack} />, {
      store: { isActiveAddress: true, setAddressDetails },
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("open region"));
    expect(screen.getByTestId("select-region"), "the form could not open the region picker").toBeInTheDocument();
    await user.click(screen.getByText("close region"));
    expect(screen.queryByTestId("select-region"), "the region picker did not close").not.toBeInTheDocument();

    await user.click(screen.getByText("form details"));
    expect(setAddressDetails, "the form details were not stored").toHaveBeenCalledWith({ id: 3 });
    await user.click(screen.getByText("form done"));
    expect(goBack, "finishing the form did not go back").toHaveBeenCalled();
  });
});
