export const useAuthStore = (set, get) => ({
  // Initial state
  user: null,
  userChat: null,
  userStories: null,
  userWallet: null,
  Tempuser: null,
  failedLogin: false,
  // "expired" shows the session-expired "please login again" prompt
  // (SessionExpiredWidget); "expired-login" is the phone-verify widget opened
  // FROM that prompt (dismissal hard-reloads immediately; success keeps the
  // normal finalise/soft-refresh path — never reload on success). Every other
  // truthy value opens the phone-verify widget directly. Kept on the same
  // marker so in-flight 401 handlers (waitForReAuthSuccess) keep waiting
  // through prompt → OTP → success.
  shouldAuthinticated: null,
  reAuthResult: null,
  // Phone of the shopper whose session /api/auth/expire nuked. Lets the
  // re-login verify widget skip phone entry (straight to OTP method) even
  // after the fresh guest profile overwrites userProfile. In-memory only —
  // survives exactly as long as the tab session.
  expiredSessionPhone: null,
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
  setReAuthResult: (reAuthResult) => set({ reAuthResult }),
  setExpiredSessionPhone: (expiredSessionPhone) => set({ expiredSessionPhone }),
  updateUserIsVerified: (user_obj) =>
    set((state) => ({
      userProfile: { ...(state.userProfile ?? {}), ...user_obj },
    })),
  setTotalOrders: (total) => set({ totalOrders: total }),
  setNotificationsType: (type) => set({ NotificationsType: type }),
  editUserInfo: (info) =>
    set((state) => ({
      userProfile: { ...(state.userProfile ?? {}), ...info },
      user: { ...(state.user ?? {}), ...info },
    })),

  cancelAuth: (isForzexpired?) =>
    set((state) => ({
      user: isForzexpired
        ? state.user && { ...state.user, is_phone_verified: 0, is_verified: 0 }
        : null,
      Tempuser: null,
      userProfile: isForzexpired
        ? state.userProfile && {
            ...state.userProfile,
            is_phone_verified: 0,
            is_verified: 0,
          }
        : null,
      userChat: isForzexpired
        ? state.userChat && {
            ...state.userChat,
            is_phone_verified: 0,
            is_verified: 0,
            need_auth: true,
          }
        : null,
      userStories: isForzexpired
        ? state.userStories && {
            ...state.userStories,
            is_phone_verified: 0,
            is_verified: 0,
            need_auth: true,
          }
        : null,
      userWallet: isForzexpired
        ? state.userWallet && {
            ...state.userWallet,
            is_phone_verified: 0,
            is_verified: 0,
            need_auth: true,
          }
        : null,
      failedLogin: false,
      attempts: 4,
      wrongNumber: "",
    })),
  loginSuccessChat: (userData) =>
    set((state) => ({
      userChat: state.userChat ? { ...state.userChat, ...userData } : userData,
    })),
  loginSuccessStories: (userData) =>
    set((state) => ({
      userStories: state.userStories
        ? { ...state.userStories, ...userData }
        : userData,
    })),
  loginSuccessWallet: (userData) =>
    set((state) => ({
      userWallet: state.userWallet
        ? { ...state.userWallet, ...userData }
        : userData,
    })),
  loginSuccess: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : userData,
      Tempuser: state.user ? { ...state.user, ...userData } : userData,
      userProfile: { ...(state.userProfile ?? {}), ...userData },
      failedLogin: false,
    })),

  loginFailed: () =>
    set((state) => ({
      failedLogin: true,
      // Floored at zero: "no attempts left" is the real state, and a negative
      // count is not something any screen can mean.
      attempts: Math.max(0, state.attempts - 1),
    })),

  setWrongNumber: (number) => set({ wrongNumber: number }),

  setVerificationId: (id) => set({ verficationID: id }),

  updateUserInfo: (profile) =>
    set((state) => ({
      userProfile: profile,
      user: { ...(state.user ?? {}), ...profile },
    })),

  getFirebaseSettings: (settings) => set({ firebaseSettings: settings }),

  disableNotification: (topic) =>
    set((state) => ({
      firebaseSettings: {
        ...state.firebaseSettings,
        subscribed_topics: state.firebaseSettings.subscribed_topics.filter(
          (s) => s.topic !== topic,
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
      // The profile record too: it is what `auth.getUser()` reads, so leaving it
      // behind showed the new name in one place and the old one in another.
      userProfile: { ...(state.userProfile ?? {}), name },
    })),
});

export default useAuthStore;
