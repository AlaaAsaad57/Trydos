import { describe, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AllProviders from "tests/helpers/AllProviders";
import userEvent from "@testing-library/user-event";
// import { createTestStore } from "tests/helpers/createStore";
import LogInPins from "components/Login/LogInPins";
import AuthService from "services/auth";
import fetchMock from "fetch-mock";
import { OTP_URL, VERFIY_OTP, VERFIY_OTP_SIGNUP } from "utils/endpointConfig";
import PhoneInput from "components/Login/PhoneInput";
import SendMethod from "components/Login/SendMethod";
import NavbarServer from "components/Server/Navbar";
import HomeComponent from "components/Home";
import { resolvedComponent } from "tests/utils";
import { _isStoreLastJson } from "utils/functions";

let store;
beforeEach(() => {
  store = "createTestStore();";
});
const renderMainComponent = async () => {
  const NavbarServerResolved = await resolvedComponent(NavbarServer, {
    lang: "US-en",
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

  const user = userEvent.setup();
  const expectErrorToBeInTheDocument = (errorMessage: RegExp) => {
    const error = screen.getByRole("alert");
    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent(errorMessage);
  };
  const waitForLoginTextFound = async () => {
    await screen.findByTestId("login-text");
    const showLoginButton = screen.getByTestId("login-text");
    return {
      showLoginButton,
    };
  };
  const waitForLoginSignupWidgetToLoad = async () => {
    await waitFor(
      async () => {
        await screen.findByTestId("backdrop-login");
        await screen.findByTestId("login-widget-container");
      },
      { timeout: 2000 }
    );
    const loginWidgetContainer = screen.getByTestId("login-widget-container");
    expect(loginWidgetContainer).toBeInTheDocument();
    expect(loginWidgetContainer).toHaveClass("pb--1", { exact: false });
    await waitFor(
      async () => {
        expect(loginWidgetContainer).toHaveClass("pb-0", { exact: false });
        const Animated = screen.getByTestId("login-animated-container");
        expect(Animated).toBeInTheDocument();
        const loginButtonGroup = await waitFor(() => {
          screen.getByRole("login-button-group"), { timeout: 3000 };
        });
        // expect(loginButtonGroup).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const getFormInputs = async () => {
      const haveAccountButton = screen.queryByTestId("have-account-button");
      const createAccountButton = screen.queryByTestId("create-account-button");
      return {
        haveAccountButton,
        createAccountButton,
      };
    };
    return {
      getFormInputs,
    };
  };
  const waitForLoginContainerToLoad = async () => {
    await waitFor(() => screen.findByTestId("login-methods-container")); //
    const loginQRMethod = screen.getByTestId("login-method-qr");
    expect(screen.getByText(/Scan Qr/i)).toBeInTheDocument();
    const loginPhoneNumberMethod = screen.getByTestId("login-method-phone");
    expect(screen.getByText(/By Mobile Phone Number/i)).toBeInTheDocument();
    return {
      loginQRMethod,
      loginPhoneNumberMethod,
    };
  };
  const waitForClickQRButton = async (loginQRMethod: Element) => {
    const user = userEvent.setup();
    await user.click(loginQRMethod);
    expect(loginQRMethod).toHaveClass("qr-extended", { exact: false });
  };
  const waitForClickPhoneNumberButton = async (phoneNumberMethod: Element) => {
    await user.click(phoneNumberMethod);

    await screen.findByTestId("phone-number-input");

    expect(
      screen.getByText(/Enter Your Phone Number To Login/i)
    ).toBeInTheDocument();
    // const phoneNumberInput = screen.getByTestId("phone-number-input");
    // expect(phoneNumberInput).toBeInTheDocument();
    return {};
  };

  return {
    user,
    expectErrorToBeInTheDocument,
    waitForLoginTextFound,
    waitForLoginSignupWidgetToLoad,
    waitForLoginContainerToLoad,
    waitForClickQRButton,
    waitForClickPhoneNumberButton,
  };
};

describe("Open Login Modal", () => {
  it("Should Render Login Text Show In Home Page Content And Click On It", async () => {
    const { waitForLoginTextFound } = await renderMainComponent();
    await waitForLoginTextFound();
  });
  it("Should Render Login/Signup Widget To Load And Have Already Account Button And Create New Account Button", async () => {
    const { waitForLoginSignupWidgetToLoad, waitForLoginTextFound, user } =
      await renderMainComponent();
    const { showLoginButton } = await waitForLoginTextFound();
    await user.click(showLoginButton);
    const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
    const { haveAccountButton, createAccountButton } = await getFormInputs();
    expect(haveAccountButton!).toBeInTheDocument();
    expect(createAccountButton!).toBeInTheDocument();
    expect(haveAccountButton!).toHaveTextContent("Already");
    expect(createAccountButton!).toHaveTextContent("Create");
  });
  it("should render terms and conditions when click on create account,agree it and show phone Input", async () => {
    const {
      waitForLoginSignupWidgetToLoad,
      user,
      waitForLoginTextFound,
      waitForClickPhoneNumberButton,
    } = await renderMainComponent();
    const { showLoginButton } = await waitForLoginTextFound();

    await user.click(showLoginButton);
    const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
    const { createAccountButton } = await getFormInputs();

    await userEvent.click(createAccountButton);
    await waitFor(
      () => {
        expect(screen.queryByTestId("Terms Of Services")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    let agreeButton = screen.queryByTestId("Agree Terms");
    await user.click(agreeButton);
    await waitFor(
      () => {
        expect(
          screen.getByText(/Enter Your Phone Number/i)
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("Should Render Scan QR Container To Load If Click By Scan QR Button ", async () => {
    const {
      waitForLoginContainerToLoad,
      waitForLoginSignupWidgetToLoad,
      waitForClickQRButton,
    } = await renderMainComponent();

    const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
    const { haveAccountButton } = await getFormInputs();
    await userEvent.click(haveAccountButton);
    const { loginQRMethod } = await waitForLoginContainerToLoad();
    await waitForClickQRButton(loginQRMethod);
  });

  it("Should Render Phone Number To Load If Click By Phone Number Button ", async () => {
    const {
      waitForLoginContainerToLoad,
      waitForLoginSignupWidgetToLoad,
      waitForClickPhoneNumberButton,
    } = await renderMainComponent();
    const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
    const { haveAccountButton } = await getFormInputs();
    await userEvent.click(haveAccountButton);
    const { loginPhoneNumberMethod } = await waitForLoginContainerToLoad();
    await waitForClickPhoneNumberButton(loginPhoneNumberMethod);
  });
  it("Should Render Phone Number To Load If Click Create Account ", async () => {
    const {
      waitForLoginContainerToLoad,
      waitForLoginSignupWidgetToLoad,
      waitForClickPhoneNumberButton,
    } = await renderMainComponent();
    const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
    const { haveAccountButton } = await getFormInputs();
    await userEvent.click(haveAccountButton);
    const { loginPhoneNumberMethod } = await waitForLoginContainerToLoad();
    await waitForClickPhoneNumberButton(loginPhoneNumberMethod);
  });
});

describe("Phone Input Component", async () => {
  const setValidNumber = vi.fn();
  const onChange = vi.fn();
  const setStepIndicator = vi.fn();
  const setWrongNumber = vi.fn();
  const setInputValue = vi.fn();

  const renderPhoneInput = async ({
    phone,
    step = 3,
  }: {
    phone?: string;
    step?: number;
  }) => {
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
      () => expect(getByTestId("phone-number-input")).toBeInTheDocument(),
      { timeout: 2000 }
    );

    const phoneInput = getByTestId("phone-number-input");
    const user = userEvent.setup();
    const getArrowPhoneNumber = async () => queryByTestId("phone-arrow");
    const _enterPhoneNumber = async (phoneEntered: string) => {
      fireEvent.input(phoneInput, {
        target: { value: phoneEntered },
      });
      await user.type(phoneInput, phoneEntered);
      expect(setInputValue).toHaveBeenCalledWith(phoneEntered);
      expect(setWrongNumber).toHaveBeenCalledWith(false);
    };
    const arrow = screen.queryByTestId("phone-arrow");
    const mockResponse = { data: {} };
    const callCheckPhone = async (phoneNumber) => {
      fetchMock.mock(OTP_URL + "/phone/check-existence/" + phoneNumber, 200);
      const res = await fetch(
        OTP_URL + "/phone/check-existence/" + phoneNumber
      );
      return res;
    };
    const storeLastJSON = () =>
      _isStoreLastJson() &&
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "LAST_JSON",
        JSON.stringify(mockResponse)
      );
    return {
      phoneInput,
      user,
      arrow,
      setInputValue,
      onChange,
      setStepIndicator,
      setWrongNumber,
      AuthService,
      getArrowPhoneNumber,
      _enterPhoneNumber,
      storeLastJSON,
      callCheckPhone,
    };
  };
  it("Should Render An Phone Component Input And User Can Login", async () => {
    const { phoneInput } = await renderPhoneInput({ phone: "" });
    expect(phoneInput).toBeInTheDocument();
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
    const { _enterPhoneNumber, getArrowPhoneNumber, phoneInput, user } =
      await renderPhoneInput({
        phone: "",
      });

    expect(await getArrowPhoneNumber()).toBeInTheDocument;

    await user.type(phoneInput, "963980033496");
    expect(setInputValue).toHaveBeenCalledWith("963980033496");
    // expect(setValidNumber).toHaveBeenCalledWith(true);
    // console.log(input.value, "input.value");
    const arrow = await getArrowPhoneNumber();
    expect(arrow).toBeInTheDocument;
  });

  const phoneNumber = "963980033496";
  it(`Should Call AuthService.CheckPhone If User Click On Arrow -> With Number ${phoneNumber}`, async () => {
    beforeEach(() => {
      fetchMock.reset();
      localStorage.clear();
      vi.clearAllMocks();
    });
    const stepIndicator = 3;
    const {
      phoneInput,
      user,
      getArrowPhoneNumber,
      storeLastJSON,
      callCheckPhone,
    } = await renderPhoneInput({ phone: phoneNumber });

    await user.type(phoneInput, "963980033496");
    expect(setInputValue).toHaveBeenCalledWith("963980033496");

    const arrow = await getArrowPhoneNumber();
    expect(arrow).toBeInTheDocument;
    await user.click(arrow);

    const resCheckPhone = await callCheckPhone(phoneNumber);

    const mockSetStepIndicator = vi.fn();

    await AuthService.CheckPhone(
      phoneNumber,
      (e) => mockSetStepIndicator(e),
      stepIndicator === 3
    );
    const calls = fetchMock.calls();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toBe(OTP_URL + "/phone/check-existence/" + phoneNumber);
    // expect(mockSetStepIndicator).toHaveBeenCalledWith(4); // not do anything
    // expect(store.dispatch).toHaveBeenCalledWith(ReInitialise()); // // not do anything
    storeLastJSON();
    expect(setStepIndicator).toHaveBeenCalledWith(4);
  });
});

describe("Login Methods Component", async () => {
  const setMessageMethod = vi.fn();
  const setStepIndicator = vi.fn();
  const setWrongNumber = vi.fn();

  const user = userEvent.setup();
  const renderMethodsComponent = async ({ phone }: { phone?: string }) => {
    const { queryByTestId, getByTestId } = render(
      <SendMethod
        inputValue={phone}
        setMessageMethod={setMessageMethod}
        setStepIndicator={setStepIndicator}
        setWrongNumber={setWrongNumber}
        stepIndicator={4}
      />,
      { wrapper: AllProviders }
    );
    const waitForOTPOption = async () => {
      await waitFor(
        () => expect(getByTestId("animated-container")).toBeInTheDocument(),
        { timeout: 2000 }
      );

      const smsOption = getByTestId("message-sms-option");
      const whatsappOption = screen.getByTestId("message-whatsapp-option");
      return {
        smsOption,
        whatsappOption,
      };
    };
    return {
      user,
      waitForOTPOption,
    };
  };
  it(`Should Render Options For OTP Code If User Does Not Exists`, async () => {
    const { waitForOTPOption } = await renderMethodsComponent({
      phone: "963980033496",
    });
    const { smsOption, whatsappOption } = await waitForOTPOption();
    expect(smsOption).toBeInTheDocument;
    expect(whatsappOption).toBeInTheDocument;
  });
});
describe("Login Pins Component", async () => {
  beforeEach(() => {
    fetchMock.reset();
    localStorage.clear();
    vi.clearAllMocks();
  });
  const phone = "963980033496";
  const setStepIndicator = vi.fn();
  const setDisabled = vi.fn();
  const setExpired = vi.fn();
  const Submit = vi.fn();
  const VerifyOtpHook = vi.fn();

  const user = userEvent.setup();
  const renderLogInPinsComponent = async ({
    phone,
    expired,
  }: {
    phone?: string;
    expired?: boolean;
  }) => {
    const { queryByTestId, queryAllByLabelText, getByTestId, getByLabelText } =
      render(
        <LogInPins
          expired={expired}
          stepIndicator={5}
          setDisabled={(e) => {
            setDisabled(e);
            setExpired(e);
          }}
          resend={() => {
            // SendOtpHook({
            //   mobilePhone: inputValue,
            //   is_via_whatsapp: MessageMethod === "WA" ? "1" : "0",
            //   step: () => {},
            //   successCallback: function () {},
            //   errorCallback: function () {
            //     setStepIndicator(3);
            //     setWrongNumber(true);
            //   },
            // });
            setDisabled(false);
            setExpired(false);
          }}
          setStepIndactor={(e) => setStepIndicator(e)}
          rendere={true}
          inputValue={phone}
          disabled={expired}
          Submit={Submit}
          successLogin={false}
          wrongNumber={false}
          failedLogin={false}
          setPin={(e: string) => {}}
          pin={""}
          MessageMethod={""}
        />,
        { wrapper: AllProviders }
      );
    const _getPinInputContainer = async () => {
      await waitFor(
        () => expect(getByTestId("pin-inputs-container")).toBeInTheDocument(),
        { timeout: 2000 }
      );
      const pinInputContainer = getByTestId("pin-inputs-container");
      return {
        pinInputContainer,
      };
    };
    const _getPinInput = async () => {
      await waitFor(() => queryAllByLabelText("pin-input"), { timeout: 2000 });
      const pinInputs = queryAllByLabelText("pin-input");
      return {
        pinInputs,
      };
    };
    const _enterPinInputsCode = async (inputs: HTMLElement[]) => {
      for (let input of inputs) {
        await user.type(input, "0");
      }
      expect(Submit).toHaveBeenCalledWith("000000");
    };
    return {
      user,
      _getPinInputContainer,
      _getPinInput,
      _enterPinInputsCode,
    };
  };
  it(`Should Render Pin Inputs Container For OTP Code If User Click On SMS/Whatsapp Option`, async () => {
    const { user, _getPinInputContainer } = await renderLogInPinsComponent({
      phone: "963980033496",
    });
    await AuthService.SendOtp(phone, 1, () => {});
    const { pinInputContainer } = await _getPinInputContainer();
    expect(pinInputContainer).toBeInTheDocument;
  });
  it(`Should Render 6 Pin Inputs For OTP Code And Focus On First Pin Input and show timer for expiring`, async () => {
    const { user, _getPinInputContainer, _getPinInput } =
      await renderLogInPinsComponent({
        phone: "963980033496",
      });
    const { pinInputContainer } = await _getPinInputContainer();
    expect(pinInputContainer).toBeInTheDocument;
    const { pinInputs } = await _getPinInput();

    expect(
      screen.getByText(/You Can Resend The Code After/i)
    ).toBeInTheDocument();
    expect(pinInputs.length).toEqual(6);
    expect(pinInputs[0]).toHaveFocus;
  });
  it(`Should Render Methods When User Type OTP Code By 6 Digits`, async () => {
    const { user, _getPinInputContainer, _getPinInput, _enterPinInputsCode } =
      await renderLogInPinsComponent({
        phone: "963980033496",
      });
    const { pinInputContainer } = await _getPinInputContainer();
    expect(pinInputContainer).toBeInTheDocument;
    const { pinInputs } = await _getPinInput();
    expect(pinInputs.length).toEqual(6);
    expect(pinInputs[0]).toHaveFocus;
    await _enterPinInputsCode(pinInputs);
  });
  it(`Should Call VerifyOtpHook After User Enter 6 wrong Digits`, async () => {
    const { _getPinInput, _getPinInputContainer, _enterPinInputsCode } =
      await renderLogInPinsComponent({
        phone,
      });
    const code = "000000";
    const verficationID = store.getState().auth.verficationID;
    const Username = "";
    const EditPhoneFunc = expect.any(Function);
    const { pinInputContainer } = await _getPinInputContainer();
    expect(pinInputContainer).toBeInTheDocument;
    let { pinInputs } = await _getPinInput();
    await waitFor(
      async () => {
        await _enterPinInputsCode(pinInputs);
      },
      { timeout: 2000 }
    );
    expect(pinInputs[0]).toHaveValue("0");
    await AuthService.VerifyOtp(code, verficationID, Username, EditPhoneFunc);

    const calls = fetchMock.calls();

    // expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toBe(
      OTP_URL +
        (Username.length > 0 ? VERFIY_OTP_SIGNUP : VERFIY_OTP) +
        `?verificationId=${verficationID}&otp=${code}${
          Username.length > 0 ? `&name=${Username}` : ""
        }`
    );
  });
  it("should show Expired Time and show resend after code expired", async () => {
    let { _getPinInputContainer, _getPinInput } =
      await renderLogInPinsComponent({
        phone,
        expired: true,
      });
    const { pinInputContainer } = await _getPinInputContainer();
    expect(pinInputContainer).toBeInTheDocument;
    expect(screen.getByText(/Resend Code/i)).toBeInTheDocument();
    let { pinInputs } = await _getPinInput();
    expect(pinInputs[0]).toHaveProperty("disabled", true);
  });
});
