const initialState = {
  user: null,
  Tempuser: null,
  failedLogin: false,
  attempts: 4,
  wrongNumber: "",
  loading: false,
  verficationID: null,
};

const AuthReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "CANCEL-AUTH": {
      return {
        ...state,
        user: null,
        Tempuser: null,
        failedLogin: false,
        attempts: 4,
        wrongNumber: "",
        loading: false,
        verficationID: null,
      };
    }
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: state.user ? { ...state.user, ...payload } : payload,
        Tempuser: state.user ? { ...state.user, ...payload } : payload,
        failedLogin: false,
      };
    case "LOGIN_FAILED": {
      return { ...state, failedLogin: true, attempts: state.attempts - 1 };
    }
    case "RE-INITILIASE": {
      return { ...state, failedLogin: false, wrongNumber: "" };
    }
    case "WRONG-NUMBER": {
      return { ...state, wrongNumber: payload };
    }
    case "LOADING-OTP": {
      return {
        ...state,
        loading: payload,
      };
    }
    case "SET-VERFICATION-ID": {
      return {
        ...state,
        verficationID: payload,
      };
    }
    case "UPDATE_USER_INFO": {
      return {
        ...state,
        user: { ...payload, already_exists: state.user?.already_exists },
        Tempuser: { ...payload, already_exists: state.user?.already_exists },
      };
    }
    case "TEMP-USER": {
      return {
        ...state,
        Tempuser: payload,
      };
    }
    case "UPDATE-NAME": {
      return {
        ...state,
        user: { ...state.user, name: payload },
        Tempuser: { ...state.user, name: payload },
      };
    }
    default:
      return state;
  }
};

export default AuthReducer;
