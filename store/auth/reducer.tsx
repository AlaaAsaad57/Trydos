interface FirebaseSettings {
  subscribed_topics: Array<{ topic: string }>;
  unsubscribed_topics: string[];
  email: number;
  whatsapp: number;
  firebase: number;
}

interface User {
  name?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  Tempuser: User | null;
  failedLogin: boolean;
  attempts: number;
  wrongNumber: string;

  verficationID: string | null;
  firebaseSettings: FirebaseSettings;
  userProfile: any | null;
  totalOrders: number;
  isActiveAddress: boolean;

  // Actions
  setIsActiveAddress: (isActive: boolean) => void;
  setTotalOrders: (total: number) => void;
  editUserInfo: (info: Partial<any>) => void;
  cancelAuth: () => void;
  loginSuccess: (userData: User) => void;
  loginFailed: () => void;
  setWrongNumber: (number: string) => void;
  setVerificationId: (id: string) => void;
  updateUserInfo: (profile: any) => void;
  getFirebaseSettings: (settings: FirebaseSettings) => void;
  disableNotification: (topic: string) => void;
  enableNotification: (topic: string) => void;
  setTempUser: (user: User) => void;
  updateName: (name: string) => void;
}

export const useAuthStore = (set, get) => ({
  // Initial state
  user: null,
  Tempuser: null,
  failedLogin: false,
  shouldAuthinticated: false,
  attempts: 4,
  wrongNumber: "",

  verficationID: null,
  firebaseSettings: {
    subscribed_topics: [],
    unsubscribed_topics: [],
    email: 0,
    whatsapp: 0,
    firebase: 0,
  },
  NotificationsType: [],
  userProfile: null,
  totalOrders: -1,
  isActiveAddress: false,

  // Actions
  setIsActiveAddress: (isActive) => set({ isActiveAddress: isActive }),
  setShouldAuthinticated: (shouldAuthinticated) => set({ shouldAuthinticated }),
  updateUserIsVerified: (user_obj) =>
    set((state) => ({ userProfile: { ...state.userProfile, ...user_obj } })),
  setTotalOrders: (total) => set({ totalOrders: total }),
  setNotificationsType: (type) => set({ NotificationsType: type }),
  editUserInfo: (info) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...info },
    })),

  cancelAuth: () =>
    set({
      user: null,
      Tempuser: null,
      failedLogin: false,
      attempts: 4,
      wrongNumber: "",

      verficationID: null,
    }),

  loginSuccess: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : userData,
      Tempuser: state.user ? { ...state.user, ...userData } : userData,
      failedLogin: false,
    })),

  loginFailed: () =>
    set((state) => ({
      failedLogin: true,
      attempts: state.attempts - 1,
    })),

  setWrongNumber: (number) => set({ wrongNumber: number }),

  setVerificationId: (id) => set({ verficationID: id }),

  updateUserInfo: (profile) => set({ userProfile: profile }),

  getFirebaseSettings: (settings) => set({ firebaseSettings: settings }),

  disableNotification: (topic) =>
    set((state) => ({
      firebaseSettings: {
        ...state.firebaseSettings,
        subscribed_topics: state.firebaseSettings.subscribed_topics.filter(
          (s) => s.topic !== topic
        ),
      },
    })),

  enableNotification: (topic) =>
    set((state) => ({
      firebaseSettings: {
        ...state.firebaseSettings,
        subscribed_topics: [
          ...state.firebaseSettings.subscribed_topics,
          { topic },
        ],
      },
    })),

  setTempUser: (user) => set({ Tempuser: user }),

  updateName: (name) =>
    set((state) => ({
      user: { ...state.user, name },
      Tempuser: { ...state.user, name },
    })),
});

export default useAuthStore;
