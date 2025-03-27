const initialState = {
  user: null,
  Tempuser: null,
  failedLogin: false,
  attempts: 4,
  wrongNumber: "",
  loading: false,
  verficationID: null,
  firebaseSettings: {
    subscribed_topics: [],
    unsubscribed_topics: [],
    email: 0,
    whatsapp: 0,
    firebase: 0,
  },
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

    case "WRONG-NUMBER": {
      return { ...state, wrongNumber: payload };
    }

    case "SET-VERFICATION-ID": {
      return {
        ...state,
        verficationID: payload,
      };
    }
    // case "UPDATE_USER_INFO": {
    //   return {
    //     ...state,
    //     user: { ...payload, already_exists: state.user?.already_exists },
    //     Tempuser: { ...payload, already_exists: state.user?.already_exists },
    //   };
    // }
    case "GET_FIREBASE_SETTINGS": {
      return {
        ...state,
        firebaseSettings: payload,
      };
    }
    case "DISABLE-NOTIFICATION": {
      return {
        ...state,
        firebaseSettings: {
          ...state.firebaseSettings,
          subscribed_topics: state.firebaseSettings.subscribed_topics.filter(
            (s) => s.topic !== payload
          ),
        },
      };
    }
    case "ENABLE-NOTIFICATION": {
      return {
        ...state,
        firebaseSettings: {
          ...state.firebaseSettings,
          subscribed_topics: [
            ...state.firebaseSettings.subscribed_topics,
            { topic: payload },
          ],
        },
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
