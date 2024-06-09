import { describe } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AllProviders from "tests/helpers/AllProviders";
import userEvent from "@testing-library/user-event";
import configureStore from "redux-mock-store";
import HomeComponent from "../../components/Home";
import { resolvedComponent } from "../utils";
import NavbarServer from "components/Server/Navbar";

const middlewares = [];
const mockStore = configureStore(middlewares);

const initialState = {
  homepage: { loginOpen: false },
};
const store = mockStore(initialState);
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

  // Replace useDispatch mock implementation with your mocked dispatch
  const _dispatch = (type: string, payload?: any) => {
    const handleDispatch = payload
      ? (e) => ({ type, payload })
      : () => ({ type });
    store.dispatch(handleDispatch(payload));
    const actions = store.getActions();
    const expectedPayload = payload ? { type, payload: payload } : { type };
    expect(actions).toEqual([expectedPayload]);
  };
  // Replace useDispatch mock implementation with your mocked dispatch
  const _selector = (type) => {
    const data = store.getState(type);
    console.log(data, "_selector");
    return data;
    // const actions = store.getActions();
    // const expectedPayload = payload ? { type, payload: payload } : { type };
    // expect(actions).toEqual([expectedPayload]);
  };
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
  };
  return {
    _selector,
    _dispatch,
    user,
    expectErrorToBeInTheDocument,
    waitForLoginTextFound,
    waitForLoginSignupWidgetToLoad,
    waitForLoginContainerToLoad,
    waitForClickQRButton,
    waitForClickPhoneNumberButton,
  };
};

const setOpenLogin = (payload) => ({ type: "LOGIN-OPEN", payload });
describe("Open Login Modal", () => {
  it("Should Render Login Text Show In Home Page Content And Click On It", async () => {
    const { waitForLoginTextFound } = await renderMainComponent();
    await waitForLoginTextFound();
  });
  it("Should Render Login/Signup Widget To Load And Have Already Account Button And Create New Account Button", async () => {
    const {
      waitForLoginSignupWidgetToLoad,
      waitForLoginTextFound,
      user,
      _dispatch,
      _selector,
    } = await renderMainComponent();
    const { showLoginButton } = await waitForLoginTextFound();
    await user.click(showLoginButton);
    _dispatch("LOGIN-OPEN", true);
    _selector(store.homepage);
    // const { getFormInputs } = await waitForLoginSignupWidgetToLoad();
    // const { haveAccountButton, createAccountButton } = await getFormInputs();
    // expect(haveAccountButton!).toBeInTheDocument();
    // expect(createAccountButton!).toBeInTheDocument();
    // expect(haveAccountButton!).toHaveTextContent("Already");
    // expect(createAccountButton!).toHaveTextContent("Create");
  });
});
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

// vi.mock("services/auth");
// describe("Phone Input Component", async () => {
//   const setValidNumber = vi.fn();
//   const onChange = vi.fn();
//   const setStepIndicator = vi.fn();
//   const setWrongNumber = vi.fn();
//   const setInputValue = vi.fn();

//   const renderPhoneInput = async ({ phone }: { phone?: string }) => {
//     const { getByTestId, queryByTestId } = render(
//       <PhoneInput
//         stepIndicator={3}
//         setStepIndicator={setStepIndicator}
//         wrongNumber={false}
//         setWrongNumber={setWrongNumber}
//         operation={"login"}
//         inputValue={phone}
//         setInputValue={setInputValue}
//       />,
//       { wrapper: AllProviders }
//     );
//     await waitFor(
//       () => expect(getByTestId("phone-number-input")).toBeInTheDocument(),
//       { timeout: 2000 }
//     );
//     const input = getByTestId("phone-number-input");
//     const user = userEvent.setup();
//     const getArrowPhoneNumber = async () => queryByTestId("phone-arrow");
//     const _enterPhoneNumber = async (phoneEntered: string) => {
//       fireEvent.input(input, { target: { value: phoneEntered } });
//       await user.type(input, phoneEntered);
//       console.log(phoneEntered, "phone entered");
//       expect(setInputValue).toHaveBeenCalledWith(phoneEntered);
//       expect(setWrongNumber).toHaveBeenCalledWith(false);
//     };
//     const arrow = screen.queryByTestId("phone-arrow");
//     const mockResponse = { data: {} };
//     const callCheckPhone = async (phoneNumber) => {
//       fetchMock.mock(OTP_URL + "/phone/check-existence/" + phoneNumber, 200);
//       const res = await fetch(
//         OTP_URL + "/phone/check-existence/" + phoneNumber
//       );
//       return res;
//     };
//     const storeLastJSON = () =>
//       _isStoreLastJson() &&
//       expect(localStorage.setItem).toHaveBeenCalledWith(
//         "LAST_JSON",
//         JSON.stringify(mockResponse)
//       );
//     return {
//       input,
//       user,
//       arrow,
//       setInputValue,
//       onChange,
//       setStepIndicator,
//       setWrongNumber,
//       AuthService,
//       getArrowPhoneNumber,
//       _enterPhoneNumber,
//       storeLastJSON,
//       callCheckPhone,
//     };
//   };
//   it("Should Render An Phone Component Input And User Can Login", async () => {
//     const { input } = await renderPhoneInput({ phone: "" });
//     expect(input).toBeInTheDocument();
//   });

//   it("Should Render An Phone Component Input And User Enter Valid Number", async () => {
//     const { _enterPhoneNumber, getArrowPhoneNumber } = await renderPhoneInput({
//       phone: "",
//     });
//     const phoneNumber = "963980033496";
//     await _enterPhoneNumber(phoneNumber);
//     expect(getArrowPhoneNumber()).toBeInTheDocument; // if valid number
//   });

//   it("Should Render An Phone Component Input And User Enter Invalid Number", async () => {
//     const { _enterPhoneNumber, getArrowPhoneNumber } = await renderPhoneInput({
//       phone: "",
//     });
//     const phoneNumber = "12345678";
//     await _enterPhoneNumber(phoneNumber);
//     expect(getArrowPhoneNumber()).not.toBeInTheDocument; // if invalid number
//   });
//   it("displays phone arrow when valid number is entered", async () => {
//     const { _enterPhoneNumber, getArrowPhoneNumber, input, user } =
//       await renderPhoneInput({
//         phone: "",
//       });

//     expect(await getArrowPhoneNumber()).toBeInTheDocument;

//     await user.type(input, "963980033496");
//     expect(setInputValue).toHaveBeenCalledWith("963980033496");
//     // expect(setValidNumber).toHaveBeenCalledWith(true);
//     // console.log(input.value, "input.value");
//     const arrow = await getArrowPhoneNumber();
//     expect(arrow).toBeInTheDocument;
//   });

//   store.dispatch = vi.fn();
//   const phoneNumber = "963980033496";
//   it(`Should Call AuthService.CheckPhone If User Click On Arrow -> With Number ${phoneNumber}`, async () => {
//     beforeEach(() => {
//       fetchMock.reset();
//       localStorage.clear();
//       vi.clearAllMocks();
//     });
//     const stepIndicator = 3;
//     const { input, user, getArrowPhoneNumber, storeLastJSON, callCheckPhone } =
//       await renderPhoneInput({ phone: phoneNumber });

//     await user.type(input, "963980033496");
//     expect(setInputValue).toHaveBeenCalledWith("963980033496");

//     const arrow = await getArrowPhoneNumber();
//     expect(arrow).toBeInTheDocument;
//     await user.click(arrow);

//     const resCheckPhone = await callCheckPhone(phoneNumber);
//     console.log(resCheckPhone, "resCheckPhone");

//     const mockSetStepIndicator = vi.fn();

//     await AuthService.CheckPhone(
//       phoneNumber,
//       (e) => mockSetStepIndicator(e),
//       stepIndicator === 3
//     );
//     const calls = fetchMock.calls();
//     expect(calls.length).toBeGreaterThan(0);
//     expect(calls[0][0]).toBe(OTP_URL + "/phone/check-existence/" + phoneNumber);
//     // expect(mockSetStepIndicator).toHaveBeenCalledWith(4); // not do anything
//     // expect(store.dispatch).toHaveBeenCalledWith(ReInitialise()); // // not do anything
//     storeLastJSON();
//     expect(setStepIndicator).toHaveBeenCalledWith(4);
//   });
// });
