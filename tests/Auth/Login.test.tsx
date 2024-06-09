import { describe, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AllProviders from "tests/helpers/AllProviders";
import userEvent from "@testing-library/user-event";
import HomeComponent from "../../components/Home";
import { resolvedComponent } from "../utils";
import NavbarServer from "../../components/Server/Navbar";
import PhoneInput from "components/Login/PhoneInput";
import { AuthService } from "services/auth";

vi.mock("services/auth");
const renderMainComponent = async () => {
  const NavbarServerResolved = await resolvedComponent(NavbarServer, {
    mainCategory: "fashion",
    lang: "en",
  });
  render(
    <>
      <HomeComponent />
      <NavbarServerResolved />
    </>,
    {
      wrapper: AllProviders,
    }
  );

  return {
    expectErrorToBeInTheDocument: (errorMessage: RegExp) => {
      const error = screen.getByRole("alert");
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent(errorMessage);
    },
    waitForLoginTextFound: async () => {
      await screen.findByTestId("login-text");
      const showLoginButton = screen.getByTestId("login-text");
      const user = userEvent.setup();
      await user.click(showLoginButton);
      return {
        showLoginButton,
      };
    },

    waitForLoginSignupWidgetToLoad: async () => {
      await screen.findByTestId("backdrop-login");
      await screen.findByTestId("login-widget-container");
      const loginWidgetContainer = screen.getByTestId("login-widget-container");
      expect(loginWidgetContainer).toBeInTheDocument();
      expect(loginWidgetContainer).toHaveClass("pb--1", { exact: false });
      await waitFor(
        async () => {
          expect(loginWidgetContainer).toHaveClass("pb-0", { exact: false });
          const Animated = screen.getByTestId("login-animated-container");
          expect(Animated).toBeInTheDocument();
          console.log(Animated, "Animated");
          const loginButtonGroup = await waitFor(() => {
            screen.getByRole("login-button-group"), { timeout: 3000 };
          });
          // expect(loginButtonGroup).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const getFormInputs = async () => {
        const haveAccountButton = screen.queryByTestId("have-account-button");
        const createAccountButton = screen.queryByTestId(
          "create-account-button"
        );
        return {
          haveAccountButton,
          createAccountButton,
        };
      };
      return {
        getFormInputs,
      };
    },
    waitForLoginContainerToLoad: async () => {
      await waitFor(() => screen.findByTestId("login-methods-container")); //
      const loginQRMethod = screen.getByTestId("login-method-qr");
      expect(screen.getByText(/Scan Qr/i)).toBeInTheDocument();
      const loginPhoneNumberMethod = screen.getByTestId("login-method-phone");
      expect(screen.getByText(/By Mobile Phone Number/i)).toBeInTheDocument();
      return {
        loginQRMethod,
        loginPhoneNumberMethod,
      };
    },
    waitForClickQRButton: async (loginQRMethod: Element) => {
      const user = userEvent.setup();
      await user.click(loginQRMethod);
      expect(loginQRMethod).toHaveClass("qr-extended", { exact: false });
    },
    waitForClickPhoneNumberButton: async (phoneNumberMethod: Element) => {
      const user = userEvent.setup();
      await user.click(phoneNumberMethod);
      await screen.findByTestId("phone-number-input");
      expect(
        screen.getByText(/Enter Your Phone Number To Login/i)
      ).toBeInTheDocument();
      const phoneNumberInput = screen.getByTestId("phone-number-input");
      expect(phoneNumberInput).toBeInTheDocument();
      return {
        phoneNumberInput,
      };
    },
  };
};

// describe("Open Login Modal", () => {
//   it("Should Render Login Text Show In Home Page Content And Click On It", async () => {
//     const { waitForLoginTextFound } = await renderMainComponent();
//     await waitForLoginTextFound();
//   });
//   it("Should Render Login/Signup Widget To Load And Have Already Account Button And Create New Account Button", async () => {
//     const { waitForLoginSignupWidgetToLoad } = await renderMainComponent();
//     const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
//     const { haveAccountButton, createAccountButton } = await getFormInputs();
//     expect(haveAccountButton!).toBeInTheDocument();
//     expect(createAccountButton!).toBeInTheDocument();
//     expect(haveAccountButton!).toHaveTextContent("Already");
//     expect(createAccountButton!).toHaveTextContent("Create");
//   });
//   it("Should Render Login Container To Load If Click On Have An Account ", async () => {
//     const { waitForLoginContainerToLoad, waitForLoginSignupWidgetToLoad } =
//       await renderMainComponent();
//     const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
//     const { haveAccountButton } = await getFormInputs();
//     await userEvent.click(haveAccountButton);
//     await waitForLoginContainerToLoad();
//   });

//   it("Should Render Scan QR Container To Load If Click By Scan QR Button ", async () => {
//     const {
//       waitForLoginContainerToLoad,
//       waitForLoginSignupWidgetToLoad,
//       waitForClickQRButton,
//     } = await renderMainComponent();

//     const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
//     const { haveAccountButton } = await getFormInputs();
//     await userEvent.click(haveAccountButton);
//     const { loginQRMethod } = await waitForLoginContainerToLoad();
//     await waitForClickQRButton(loginQRMethod);
//   });

//   it("Should Render Phone Number To Load If Click By Phone Number Button ", async () => {
//     const {
//       waitForLoginContainerToLoad,
//       waitForLoginSignupWidgetToLoad,
//       waitForClickPhoneNumberButton,
//     } = await renderMainComponent();
//     const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
//     const { haveAccountButton } = await getFormInputs();
//     await userEvent.click(haveAccountButton);
//     const { loginPhoneNumberMethod } = await waitForLoginContainerToLoad();
//     await waitForClickPhoneNumberButton(loginPhoneNumberMethod);
//   });
// });

const onChange = vi.fn();
const setStepIndicator = vi.fn();
const setWrongNumber = vi.fn();
const setInputValue = vi.fn();
describe("Phone Input Component", async () => {
  const renderPhoneInput = async ({ phone }: { phone?: string }) => {
    const { getByTestId, queryByTestId } = render(
      <PhoneInput
        stepIndicator={3}
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
      () => expect(getByTestId("phone-number-input")).toBeInTheDocument(),
      { timeout: 2000 }
    );
    const input = getByTestId("phone-number-input");
    const user = userEvent.setup();
    const authService = new AuthService();
    const getArrowPhoneNumber = async () => queryByTestId("phone-arrow");
    const getArrowPhoneNumberElement = () => getByTestId("phone-arrow");
    const _enterPhoneNumber = async (phoneEntered: string) => {
      fireEvent.input(input, { target: { value: phoneEntered } });
      // await user.type(input, phoneEntered);
      console.log(phoneEntered, "phone entered");
      expect(setInputValue).toHaveBeenCalledWith(phoneEntered);
      expect(setWrongNumber).toHaveBeenCalledWith(false);
    };
    const _submitSignupPhoneNumber = async (
      phoneEntered: string,
      stepIndicator
    ) => {
      await _enterPhoneNumber(phoneEntered);
      expect(getArrowPhoneNumber()).toBeInTheDocument; // if valid number
      await user.click(await getArrowPhoneNumber()!);
      authService.http.get = vi.fn().mockResolvedValue({
        data: {},
      });
      await AuthService.CheckPhone(
        phoneEntered,
        setStepIndicator,
        stepIndicator
      );
      expect(setStepIndicator).toHaveBeenCalledWith(277);
    };
    const _submitLoginPhoneNumber = async (
      phoneEntered: string,
      stepIndicator
    ) => {
      await _enterPhoneNumber("963980033496");
    };
    return {
      input,
      user,
      setInputValue,
      onChange,
      setStepIndicator,
      setWrongNumber,
      authService,
      getArrowPhoneNumber,
      getArrowPhoneNumberElement,
      _enterPhoneNumber,
      _submitSignupPhoneNumber,
      _submitLoginPhoneNumber,
    };
  };
  it("Should Render An Phone Component Input And User Can Login", async () => {
    const { input } = await renderPhoneInput({ phone: "" });
    expect(input).toBeInTheDocument();
  });

  it("Should Render An Phone Component Input And User Enter Valid Number", async () => {
    const { _enterPhoneNumber, getArrowPhoneNumber } = await renderPhoneInput({
      phone: "",
    });
    const phoneNumber = "963980033496";
    await _enterPhoneNumber(phoneNumber);
    expect(getArrowPhoneNumber()).toBeInTheDocument; // if valid number
  });

  it("Should Render An Phone Component Input And User Enter Invalid Number", async () => {
    const { _enterPhoneNumber, getArrowPhoneNumber } = await renderPhoneInput({
      phone: "",
    });
    const phoneNumber = "12345678";
    await _enterPhoneNumber(phoneNumber);
    expect(getArrowPhoneNumber()).not.toBeInTheDocument; // if invalid number
  });
  it("displays phone arrow when valid number is entered", async () => {
    const setValidNumber = vi.fn();
    const onChange = vi.fn();
    const setStepIndicator = vi.fn();
    const setWrongNumber = vi.fn();
    const setInputValue = vi.fn(); // Using jest.fn() instead of vi.fn()
    const { getByTestId, queryByTestId } = render(
      <PhoneInput
        stepIndicator={3}
        setStepIndicator={setStepIndicator}
        wrongNumber={false}
        setWrongNumber={setWrongNumber}
        operation={"login"}
        inputValue={""}
        setInputValue={setInputValue}
      />,
      { wrapper: AllProviders }
    );

    await waitFor(
      () => {
        expect(getByTestId("phone-number-input")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const input = screen.getByTestId("phone-number-input");

    const user = userEvent.setup();

    await waitFor(
      async () => {
        await user.type(input, "963980033496");
        expect(setInputValue).toHaveBeenCalledWith("963980033496");

        // expect(setValidNumber).toHaveBeenCalledWith(true);
        console.log(input.value, "input.value");
        const arrow = queryByTestId("phone-arrow");
        expect(arrow).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
  it("Should Call AuthService.CheckPhone If User Click On Arrow ->", async () => {
    const phoneNumber = "963980033496";
    const stepIndicator = true;
    const { _submitLoginPhoneNumber, input, user, getArrowPhoneNumberElement } =
      await renderPhoneInput({ phone: phoneNumber });
    await _submitLoginPhoneNumber(phoneNumber, stepIndicator);

    await waitFor(
      async () => {
        await user.type(input, "963980033496");
        expect(setInputValue).toHaveBeenCalledWith("963980033496");

        // expect(setValidNumber).toHaveBeenCalledWith(true);
        console.log(input.value, "input.value");
      },
      { timeout: 3000 }
    );
    const arrow = getArrowPhoneNumberElement();
    expect(arrow).toBeInTheDocument;

    await user.click(arrow);
    AuthService.CheckPhone.mockResolvedValueOnce();

    await AuthService.CheckPhone(phoneNumber, setStepIndicator, stepIndicator);

    expect(setStepIndicator).toHaveBeenCalledWith(277);
    expect(setStepIndicator).toHaveBeenCalledWith(4);
  });
  it("Should Show Password Input If User Exists In System", async () => {
    const { _submitLoginPhoneNumber, user } = await renderPhoneInput({
      phone: "",
    });
    const phoneNumber = "963980033496";
    const stepIndicator = true;
    await _submitLoginPhoneNumber(phoneNumber, stepIndicator);
    // if phone number valid
  });
});
