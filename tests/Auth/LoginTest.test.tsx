import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogInPins from "components/Login/LogInPins";
import PhoneInput from "components/Login/PhoneInput";
import SendMethod from "components/Login/SendMethod";
import NavbarServer from "components/Server/Navbar";
import AllProviders from "tests/helpers/AllProviders";
import { resolvedComponent } from "tests/utils";
import { describe, test, vi } from "vitest";
const user = userEvent.setup();

const renderMainComponent = async () => {
  const Navbar = await resolvedComponent(NavbarServer, { lang: "en-us" });
  render(
    <AllProviders>
      <Navbar />
    </AllProviders>
  );
};
const OpenLogin = async () => {
  await renderMainComponent();
  const user = userEvent.setup();
  await screen.findByTestId("login-text");
  const showLoginButton = screen.getByTestId("login-text");
  user.click(showLoginButton);
  await waitFor(
    () => {
      expect(screen.getByTestId("login-button-group")).toBeInTheDocument();
    },
    { timeout: 3000 }
  );
};
const ShowPhone = async () => {
  let HaveAccountButton = screen.getByTestId("have-account-button");
  await user.click(HaveAccountButton);
  let phone = "963937288307";
  let step = 3;
  const setValidNumber = vi.fn();
  const onChange = vi.fn();
  const setStepIndicator = vi.fn();
  const setWrongNumber = vi.fn();
  const setInputValue = vi.fn();
  const { getByTestId, queryByTestId } = render(
    <PhoneInput
      stepIndicator={step}
      setStepIndicator={setStepIndicator}
      wrongNumber={false}
      setWrongNumber={setWrongNumber}
      operation={"login"}
      inputValue={phone}
      setInputValue={setInputValue}
    />,
    { wrapper: AllProviders }
  );

  await waitFor(
    async () => {
      let phoneInput = screen.getByTestId("phone-number-input");
      user.type(phoneInput, "963937288307");
      expect(screen.getByTestId("phone-arrow")).toBeInTheDocument();
      await user.click(screen.getByTestId("phone-arrow"));
    },
    { timeout: 2000 }
  );
};
const showRecievingMethods = async () => {
  let step = 4;
  let phone = "963937288307";
  const setValidNumber = vi.fn();
  const onChange = vi.fn();
  const setStepIndicator = vi.fn();
  const setWrongNumber = vi.fn();
  const setMessageMethod = vi.fn();
  const setInputValue = vi.fn();
  render(
    <SendMethod
      inputValue={phone}
      setMessageMethod={setMessageMethod}
      setStepIndicator={setStepIndicator}
      setWrongNumber={setWrongNumber}
      stepIndicator={step}
    />,
    {
      wrapper: AllProviders,
    }
  );
  waitFor(async () => {
    let WAButton = screen.getByTestId("message-whatsapp-option");
    await user.click(WAButton);
  });
};
describe("Login Senario", async () => {
  const user = userEvent.setup();
  test("1-should open login widget when click on login", async () => {
    await OpenLogin();
  });
  test.each(["take-look-text", "login-close-icon"])(
    `2-should close login when click on %s `,
    async (label) => {
      await OpenLogin();
      expect(screen.getByTestId("login-button-group")).toBeInTheDocument();
      const LaterButton = screen.getByTestId(label);

      user.click(LaterButton);
      await waitFor(
        async () => {
          expect(
            screen.queryByTestId("login-button-group")
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    }
  );
  test("3 should Show Phone Input when click on I have account and show blue array if valid", async () => {
    await OpenLogin();
    await ShowPhone();
  });
  test("4 should show otp message receiving methods and send otp to whatsapp number", async () => {
    await OpenLogin();
    await ShowPhone();
    await showRecievingMethods();
  });
  test("5 should show pin input and enter 6 digits to access", async () => {
    let setDisabled = vi.fn();
    let setPin = vi.fn();
    let setStepIndactor = vi.fn();
    let stepIndicator = 5;
    let successLogin = false;
    let wrongNumber = false;
    const Submit = vi.fn();
    const disabled = false;
    const expired = false;
    const failedLogin = false;
    let inputValue = "963937288307";
    let MessageMethod = "WA";
    let pin = "999999";

    render(
      <LogInPins
        setDisabled={setDisabled}
        setPin={setPin}
        setStepIndactor={setStepIndactor}
        stepIndicator={stepIndicator}
        successLogin={successLogin}
        wrongNumber={wrongNumber}
        MessageMethod={MessageMethod}
        Submit={Submit}
        disabled={disabled}
        expired={expired}
        failedLogin={failedLogin}
        inputValue={inputValue}
        pin={pin}
        rendere={rendere}
        resend={resend}
      />,
      { wrapper: AllProviders }
    );

    await waitFor(
      () => {
        let pinContainer = screen.getByTestId("pin-inputs-container");
        let pins = pinContainer.querySelectorAll(
          ".pincode-input-container .pincode-input-text"
        );
        expect(pins.length).toEqual(6);
      },
      { timeout: 1000 }
    );
  });
});
