import { getUserChat, translateFunction as translate } from "utils/functions";
import {
  MuteChat,
  PinnChat,
  Recive,
  deleteChat,
  watchChannel as watchChannelAction,
} from "./actions";
import { getMediaReducer } from "./actions";

interface ChatState {
  chatVar: boolean;
  data: any[];
  MessageActiveCall: number | null;
  activeChat: any | null;
  main: string;
  chat_loading: boolean;
  refs: boolean;
  contacts: any[];
  channels: any[];
  users: any[];
  qouted: any | null;
  NotificationPremission: boolean;
  pusher_channels: any[];
  searchChat: {
    searchValue: string;
    loading: boolean;
    activeMessage: any | null;
    messages: any[];
    offset: string;
  };
  user_loading: boolean;
  fbToken: string | null;
  newChats: any[];
  openChatRenderer: any | null;
  pinnedChats: any[];
  date: string;
  call_loading: boolean;
  chatUsers: any[];
  call: any | null;
  fetch: boolean;
  first: boolean;
  mid: number | null;
  ref: boolean;
  isCallIncoming: boolean;
  incomeCallData: any | null;
  incomeCallType: string | null;
  caller: {
    channel_name: string;
    mobile_phone: string;
    photo_path: string | null;
  };
  callerChannel: any | null;
  callInProgress: boolean | number;
  isReachTheFinalMes: boolean;
  replyMessage: any | null;
  forwarded_message: any | null;
  Server_time: any | null;
  calls: any[];
  chatSearchResults: any[];
  lastNotification: any | null;
  callLoading: any | null;
  AgoraToken: string | null;
  client: any | null;
  nameModal: boolean;
}

const initialState: ChatState = {
  chatVar: false,
  data: [],
  MessageActiveCall: null,
  activeChat: null,
  main: "main",
  chat_loading: true,
  refs: false,
  contacts: [],
  channels: [],
  users: [],
  qouted: null,
  NotificationPremission: false,
  pusher_channels: [],
  searchChat: {
    searchValue: "",
    loading: false,
    activeMessage: null,
    messages: [],
    offset: "0",
  },
  user_loading: false,
  fbToken: null,
  newChats: [],
  openChatRenderer: null,
  pinnedChats: [],
  date: "Today",
  call_loading: false,
  chatUsers: [],
  call: null,
  fetch: true,
  first: false,
  mid: null,
  ref: false,
  isCallIncoming: false,
  incomeCallData: null,
  incomeCallType: null,
  caller: {
    channel_name: "",
    mobile_phone: "",
    photo_path: null,
  },
  callerChannel: null,
  callInProgress: false,
  isReachTheFinalMes: false,
  replyMessage: null,
  forwarded_message: null,
  Server_time: null,
  calls: [],
  chatSearchResults: [],
  lastNotification: null,
  callLoading: null,
  AgoraToken: null,
  client: null,
  nameModal: false,
};

export const useChatStore = (set, get) => ({
  ...initialState,

  setServerTime: (payload: any) => set({ Server_time: payload }),

  storeClient: (payload: any) => set({ client: payload }),

  setCallLoading: (payload: any) => set({ callLoading: payload }),

  setCallLoadingState: (payload: boolean) => set({ call_loading: payload }),

  setChatOpen: (payload: boolean) => {
    if (payload === false) {
      set({ chatVar: false, activeChat: null, main: "main" });
      return;
    }
    if (JSON.parse(localStorage.getItem("USER"))?.name?.length > 2) {
      set({ chatVar: payload });
    } else {
      set({ nameModal: true });
    }
  },

  setLastNotificationDate: (payload: any) => set({ lastNotification: payload }),

  setContacts: (payload: any[]) => set({ contacts: payload }),

  setChatSearchResults: (payload: any[]) => set({ chatSearchResults: payload }),

  setForwardMessage: (payload: any) =>
    set({
      forwarded_message: payload,
      main: "MAIN",
    }),

  setCalls: (payload: any[]) => {
    const currentCalls = get().calls;
    const newCalls = [...currentCalls];

    payload.forEach((call) => {
      if (!currentCalls.some((c) => c.id === call.id)) {
        newCalls.push(call);
      }
    });

    set({
      calls: newCalls,
      call_loading: false,
    });
  },

  endCall: (payload: number) => {
    const state = get();
    if (
      parseInt(state.MessageActiveCall?.toString() || "0") ===
        parseInt(payload.toString()) ||
      payload === -1
    ) {
      if (state.client) {
        state.client?.leave();
        state.client?.removeAllListeners();
      }
      set({
        call: null,
        callInProgress: false,
        isCallIncoming: false,
        callLoading: false,
        incomeCallData: null,
        incomeCallType: null,
        caller: null,
        callerChannel: null,
        MessageActiveCall: null,
      });
    }
  },

  setNotificationPermission: (payload: boolean) =>
    set({ NotificationPremission: payload }),

  setVideoCall: (payload: any, source: any) => {
    const state = get();
    const newActive = {
      ...state.activeChat,
      messages: [
        ...state.activeChat.messages,
        { ...source, message_type: { name: "VideoCall" } },
      ],
      id: source.channel.id,
    };

    let arr = [];
    if (
      state.data.filter((m) => parseInt(m.id) === parseInt(source.channel.id))
        .length === 0
    ) {
      arr.push(newActive);
    }

    state.data.forEach((m) => {
      if (parseInt(m.id) === parseInt(source.channel.id)) {
        arr.push(newActive);
      } else {
        arr.push(m);
      }
    });

    set({
      activeChat: newActive,
      call: "vid-outgoing",
      callInProgress: true,
      data: arr,
      AgoraToken: payload,
      MessageActiveCall: source.id,
    });
  },

  editCall: (payload: any) => {
    const state = get();
    let tempCalls = [];

    if (
      state.calls.some((call) => parseInt(call.id) === parseInt(payload.id))
    ) {
      state.calls.forEach((call) => {
        if (parseInt(call.id) === parseInt(payload.id)) {
          tempCalls.push(payload);
        } else {
          tempCalls.push(call);
        }
      });
    } else {
      tempCalls = [payload, ...state.calls];
    }

    set({ calls: tempCalls });
  },

  setAudioCall: (payload: any, source: any) => {
    const state = get();
    const newActive = {
      ...state.activeChat,
      messages: [
        ...state.activeChat.messages,
        { ...source, message_type: { name: "VideoCall" } },
      ],
      id: source.channel.id,
    };

    let arr = [];
    if (
      state.data.filter((m) => parseInt(m.id) === parseInt(source.channel.id))
        .length === 0
    ) {
      arr.push(newActive);
    }

    state.data.forEach((m) => {
      if (parseInt(m.id) === parseInt(source.channel.id)) {
        arr.push(newActive);
      } else {
        arr.push(m);
      }
    });

    set({
      call: "aud-outgoing",
      data: arr,
      callInProgress: true,
      activeChat: newActive,
      AgoraToken: payload,
      MessageActiveCall: source.id,
    });
  },

  refuseCall: (payload: number) => {
    const state = get();
    if (
      parseInt(payload.toString()) ===
      parseInt(state.MessageActiveCall?.toString() || "0")
    ) {
      set({
        call: false,
        isCallIncoming: false,
        incomeCallType: null,
        incomeCallData: null,
        caller: null,
        callerChannel: null,
      });
    }
  },

  answerCall: (payload: any) => {
    const state = get();
    if (state.incomeCallType === "audio") {
      const activeChat = state.data.filter(
        (s) => parseInt(s.id) === parseInt(state.callerChannel.id)
      )[0] || {
        ...state.callerChannel,
        channel_name: state.caller?.channel_name,
        mobile_phone: state.caller?.mobile_phone,
        photo_path: state.caller?.photo_path,
      };

      const newData =
        state.data.filter(
          (s) => parseInt(s.id) === parseInt(state.callerChannel.id)
        ).length === 0
          ? [
              {
                ...state.callerChannel,
                channel_name: state.caller.channel_name,
                mobile_phone: state.caller.mobile_phone,
                photo_path: state.caller.photo_path,
              },
              ...state.data,
            ]
          : state.data;

      set({
        call: "aud-incoming",
        activeChat,
        data: newData,
        main: "chat",
        isCallIncoming: false,
        callInProgress: true,
        AgoraToken: payload,
      });
    } else {
      const activeChat = {
        ...state.callerChannel,
        channel_name: state.caller.channel_name,
        mobile_phone: state.caller.mobile_phone,
        photo_path: state.caller.photo_path,
      };

      const newData =
        state.data.filter(
          (s) => parseInt(s.id) === parseInt(state.callerChannel.id)
        ).length === 0
          ? [
              {
                ...state.callerChannel,
                channel_name: state.caller.channel_name,
                mobile_phone: state.caller.mobile_phone,
                photo_path: state.caller.photo_path,
              },
              ...state.data,
            ]
          : state.data;

      set({
        call: "vid-incoming",
        activeChat,
        data: newData,
        main: "chat",
        isCallIncoming: false,
        callInProgress: true,
        AgoraToken: payload,
      });
    }
  },

  setUserAnswerCall: () => set({ isCallIncoming: false }),

  setIncomingVoiceCall: (payload: any) =>
    set({
      isCallIncoming: true,
      MessageActiveCall: payload.message_id,
      incomeCallData: payload,
      caller: payload.caller,
      callerChannel: payload.callerChannel,
      incomeCallType: "audio",
    }),

  setIncomingCall: (payload: any) =>
    set({
      isCallIncoming: true,
      incomeCallData: payload,
      MessageActiveCall: payload.message_id,
      caller: payload.caller,
      callerChannel: payload.callerChannel,
      incomeCallType: "video",
    }),

  setCall: (payload: any) => {
    const state = get();
    const pa = payload
      ? state.data.filter((s) => s.pusher_channel_name === payload.channel)[0]
      : null;
    set({ call: pa });
  },

  setChatSearchValue: (payload: string) =>
    set((state) => ({
      searchChat: {
        ...state.searchChat,
        searchValue: payload,
      },
    })),

  setChatSearchRequest: (payload: any) =>
    set((state) => ({
      searchChat: {
        ...state.searchChat,
        loading: false,
        messages: payload.messages,
        activeMessage: payload.messages[payload.messages.length - 1] ?? null,
      },
    })),

  setChatSearchId: (payload: any) =>
    set((state) => ({
      searchChat: {
        ...state.searchChat,
        activeMessage: payload,
      },
    })),

  setChatSearchLoading: (payload: boolean) =>
    set((state) => ({
      searchChat: {
        ...state.searchChat,
        loading: payload,
      },
    })),

  sendNewMessage: (payload: any) =>
    set((state) => ({
      activeChat:
        state.activeChat.id === payload.channel.mid
          ? { ...state.activeChat, ...payload.channel }
          : state.activeChat,
      data: [
        {
          ...state.data.filter((c) => c.id === payload.channel.mid)[0],
          ...payload.channel,
        },
        ...state.data.filter((c) => c.id !== payload.channel.mid),
      ],
      main: "chat",
      ref: !state.ref,
    })),

  setRefs: () =>
    set((state) => ({
      refs: !state.refs,
      ref: !state.ref,
    })),

  setIsTyping: (payload: any) => {
    const state = get();
    const id = payload.id;
    let active = state.activeChat;
    let chs = [];

    state.data.forEach((ch) => {
      if (parseInt(id) === parseInt(ch.id)) {
        chs.push({
          ...ch,
          status: payload.desc,
          activeDate: payload?.date || ch.activeDate,
        });
      } else {
        chs.push(ch);
      }
    });

    if (state.activeChat && parseInt(state.activeChat.id) === parseInt(id)) {
      active = {
        ...state.activeChat,
        status: payload.desc,
        activeDate: payload?.date || state.activeChat.activeDate,
      };
    }

    set({
      data: [...chs],
      activeChat: active || state.activeChat,
    });
  },

  watchChannelEvent: (payload: number) => {
    const state = get();
    const id = parseInt(payload.toString());
    let newChats = [];
    let active = null;

    state.data.forEach((a) => {
      if (parseInt(a.id) === id) {
        let m = [];
        a.messages.forEach((mes) => {
          let newst = [];
          let st = mes.message_status;
          if (mes.sender_user_id && !mes.message_type.name.includes("Call")) {
            st.forEach((sta) => {
              let newdate = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
              if (sta.user_id !== getUserChat()?.id) {
                newst.push({
                  ...sta,
                  is_watched: true,
                  watched_at: sta.watched_at
                    ? sta.watched_at
                    : newdate.toLocaleString().toString(),
                });
              } else {
                if (sta.watched_at) {
                  newst.push({ ...sta, is_watched: true, is_received: 1 });
                } else {
                  newst.push({
                    ...sta,
                    is_watched: true,
                    is_received: 1,
                    watched_at: new Date(
                      new Date().getTime() - 3 * 60 * 60 * 1000
                    )
                      .toLocaleString()
                      .toString(),
                  });
                }
              }
            });
          }
          if (mes.sender_user_id !== getUserChat()?.id) {
            newst = mes.message_status;
          }
          m.push({ ...mes, message_status: newst });
        });
        newChats.push({ ...a, messages: m });
        if (state.activeChat && state.activeChat.id) {
          active = state.activeChat;
          if (parseInt(active.id) === parseInt(payload.toString())) {
            active = { ...a, messages: m };
          }
        }
      } else {
        newChats.push(a);
      }
    });
    if (parseInt(state.activeChat.id) === parseInt(payload.toString())) {
      let m = [];
      state.activeChat.messages.forEach((mes) => {
        let newst = [];
        let st = mes.message_status;
        if (mes.sender_user_id && !mes.message_type.name.includes("Call")) {
          st.forEach((sta) => {
            let newdate = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
            if (sta.user_id !== getUserChat()?.id) {
              newst.push({
                ...sta,
                is_watched: true,
                watched_at: sta.watched_at
                  ? sta.watched_at
                  : newdate.toLocaleString().toString(),
              });
            } else {
              if (sta.watched_at) {
                newst.push({ ...sta, is_watched: true, is_received: 1 });
              } else {
                newst.push({
                  ...sta,
                  is_watched: true,
                  is_received: 1,
                  watched_at: new Date(
                    new Date().getTime() - 3 * 60 * 60 * 1000
                  )
                    .toLocaleString()
                    .toString(),
                });
              }
            }
          });
        }
        if (mes.sender_user_id !== getUserChat()?.id) {
          newst = mes.message_status;
        }
        m.push({ ...mes, message_status: newst });
      });
      active = { ...state.activeChat, messages: m };
    }
    set({
      data: newChats,
      activeChat: active,
      newChats: state.newChats.filter((a) => parseInt(a.id) !== payload),
    });
  },

  watchChannel: (payload: number | string) => {
    const state = get();
    const id = parseInt(payload.toString());

    if (
      (typeof payload === "string" && !payload.includes("ch")) ||
      typeof payload === "number"
    ) {
      watchChannelAction(payload);
    }

    let newChats = [];
    let active = state.activeChat;

    if (
      state.data.filter((s) => parseInt(s.id) === parseInt(id.toString()))
        .length > 0 ||
      (typeof payload === "string" && payload.includes("ch"))
    ) {
      state.data.forEach((a) => {
        if (parseInt(a.id) === id) {
          let m = [];
          a.messages.forEach((mes) => {
            let newst = [];
            let st = mes.message_status;
            if (mes.sender_user_id && !mes.message_type.name.includes("Call")) {
              st.forEach((sta) => {
                let newdate = new Date(
                  new Date().getTime() - 3 * 60 * 60 * 1000
                )
                  .toLocaleString()
                  .toString();
                if (sta.user_id !== getUserChat()?.id) {
                  newst.push({
                    ...sta,
                    is_watched: true,
                    watched_at: sta.watched_at ? sta.watched_at : newdate,
                  });
                } else {
                  if (sta.watched_at) {
                    newst.push({ ...sta, is_watched: true, is_received: 1 });
                  } else {
                    newst.push({
                      ...sta,
                      is_watched: true,
                      is_received: 1,
                      watched_at: new Date(
                        new Date().getTime() - 3 * 60 * 60 * 1000
                      )
                        .toLocaleString()
                        .toString(),
                    });
                  }
                }
              });
            }
            if (
              mes.sender_user_id === getUserChat()?.id &&
              !mes.message_type.name.includes("Call")
            ) {
              newst = mes.message_status;
            }
            m.push({ ...mes, message_status: newst });
          });
          newChats.push({ ...a, messages: m });
          if (state.activeChat && state.activeChat.id) {
            active = state.activeChat;
            if (parseInt(active.id) === parseInt(payload.toString())) {
              active = { ...a, messages: m };
            }
          }
        } else {
          newChats.push(a);
        }
      });

      set({
        data: state.data.find((s) => parseInt(s.id) === parseInt(id.toString()))
          ? newChats
          : state.data,
        activeChat: active?.id ? active : state.activeChat,
        newChats: state.newChats.filter(
          (a) => parseInt(a.id) !== parseInt(payload.toString())
        ),
      });
    }
  },

  receiveChannelEvent: (payload: number | string) => {
    const state = get();
    const id = parseInt(payload.toString());

    if (
      (typeof payload === "string" && !payload.includes("ch")) ||
      typeof payload === "number"
    ) {
      Recive(payload);
    }

    let newChats = [];
    let active = state.activeChat;

    state.data.forEach((a) => {
      if (parseInt(a.id) === id) {
        let m = [];
        a.messages.forEach((mes) => {
          let newst = [];
          let st = mes.message_status;
          if (mes.sender_user_id && !mes.message_type.name.includes("Call")) {
            st.forEach((sta) => {
              let newdate = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
              if (sta.user_id !== getUserChat()?.id) {
                newst.push({
                  ...sta,
                  is_received: 1,
                  received_at: sta.received_at
                    ? sta.received_at
                    : newdate.toLocaleString().toString(),
                });
              } else {
                if (sta.received_at) {
                  newst.push({ ...sta, is_received: 1 });
                } else {
                  newst.push({
                    ...sta,
                    is_received: 1,
                    received_at: new Date(
                      new Date().getTime() - 3 * 60 * 60 * 1000
                    )
                      .toLocaleString()
                      .toString(),
                  });
                }
              }
            });
          }
          m.push({ ...mes, message_status: newst });
        });
        newChats.push({ ...a, messages: m });
        if (state.activeChat && state.activeChat.id) {
          active = state.activeChat;
          if (parseInt(active.id) === parseInt(payload.toString())) {
            active = { ...a, messages: m };
          }
        }
      } else {
        newChats.push(a);
      }
    });
    if (parseInt(active.id) === parseInt(payload.toString())) {
      let m = [];
      active.messages.forEach((mes) => {
        let newst = [];
        let st = mes.message_status;
        if (mes.sender_user_id && !mes.message_type.name.includes("Call")) {
          st.forEach((sta) => {
            let newdate = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
            if (sta.user_id !== getUserChat()?.id) {
              newst.push({
                ...sta,
                is_received: 1,
                received_at: sta.received_at
                  ? sta.received_at
                  : newdate.toLocaleString().toString(),
              });
            } else {
              if (sta.received_at) {
                newst.push({ ...sta, is_received: 1 });
              } else {
                newst.push({
                  ...sta,
                  is_received: 1,
                  received_at: new Date(
                    new Date().getTime() - 3 * 60 * 60 * 1000
                  )
                    .toLocaleString()
                    .toString(),
                });
              }
            }
          });
        }
        m.push({ ...mes, message_status: newst });
      });
      active = { ...active, messages: m };
    }
    set({
      data: newChats,
      activeChat: active,
      newChats: [...state.newChats],
    });
  },

  openChat: (payload: any) => {
    const state = get();
    if (
      payload &&
      payload.id &&
      !(typeof payload.id === "string" && payload.id?.includes("ch"))
    ) {
      let s = state.newChats.filter((a) => a.id !== payload.id);
      set({
        activeChat:
          state.data.filter((a) => a.id === payload.id).length > 0
            ? state.data.filter((a) => a.id === payload.id)[0]
            : payload,
        newChats: [...s],
        openChatRenderer: Math.random(),
      });
    } else {
      console.log(payload);
      set({
        activeChat: payload,
        newChats: state.newChats,
        fetch: true,
        first: true,
        mid: null,
      });
    }
  },

  sendMessage: (payload: any) => {
    const state = get();
    let ac = payload.act;
    let chat = state.data;
    let arr = [];
    let active = state.activeChat;
    if (payload.isNew || payload.act?.id?.includes("ch")) {
      if (!payload.isPrivate) {
        arr.push({
          ...payload.act,
          messages: [...ac.messages, payload.message],
        });
        arr = [...arr, ...chat];
      } else {
        if (
          state.activeChat?.id &&
          parseInt(state.activeChat?.id) === parseInt(payload?.act.id)
        ) {
          active = {
            ...state?.activeChat,
            messages: [...ac.messages, payload.message],
          };
        }
        arr = state.data;
      }
      set({
        data: arr,
        activeChat:
          state.activeChat &&
          state.activeChat?.id === ac.id &&
          arr.filter((t) => t.id === state.activeChat?.id)[0]
            ? arr.filter((t) => t.id === state.activeChat?.id)[0]
            : active,
        ref: !state.ref,
        refs: !state.refs,
        replyMessage: null,
      });
    } else {
      let PrivateChannel = null;
      if (payload.isPrivate) {
        PrivateChannel = state.activeChat;
        PrivateChannel.messages.push(payload.message);
        set({
          activeChat: PrivateChannel,
          ref: !state.ref,
          refs: !state.refs,
          replyMessage: null,
        });
        return;
      }
      chat.forEach((a) => {
        if (
          parseInt(a.id) === parseInt(ac.id) &&
          a.messages.filter(
            (m) => m.id && parseInt(m?.id) === parseInt(payload.message?.id)
          ).length === 0
        ) {
          a.messages.push(payload.message);
        }
      });
      chat.forEach((a) => {
        if (parseInt(a.id) === parseInt(ac.id)) {
          arr.push(a);
        }
      });
      chat.forEach((a) => {
        if (parseInt(a.id) !== parseInt(ac.id)) {
          arr.push(a);
        }
      });

      set({
        data: payload.isPrivate ? state.data : arr,
        activeChat:
          state.activeChat && parseInt(state.activeChat?.id) === parseInt(ac.id)
            ? arr.filter(
                (t) =>
                  parseInt(t.id) === parseInt(state.activeChat?.id) ||
                  t.mid === state.activeChat?.mid
              )[0]
            : state.activeChat,
        ref: !state.ref,
        refs: !state.refs,
        replyMessage: null,
      });
    }
  },

  sendRealMessage: (payload: any) => {
    const state = get();
    let ac = payload.cid;
    let chat = state.data;
    let act = null;
    let chatData = [];
    if (payload.isPrivate) {
      act = {
        ...state.activeChat,
        id: payload?.channel_id,
      };
      let mar = [];

      act.messages.forEach((m) => {
        if (
          m.mid &&
          m.mid === payload.mid &&
          mar.filter((S) => S.id === payload.id).length === 0
        ) {
          mar.push({
            ...payload,
            message_status: m.message_status,
            mid: null,
          });
        } else {
          mar.push(m);
        }
      });
      act.messages = mar;

      set({
        activeChat: act,
      });
      return;
    }
    chat.forEach((a) => {
      if (a.id === ac) {
        let mar = [];
        let sele = a.messages;
        sele.forEach((m) => {
          if (
            m.mid &&
            m.mid === payload.mid &&
            mar.filter((S) => S.id === payload.id).length === 0
          ) {
            mar.push({
              ...payload,
              message_status: m.message_status,
              mid: null,
            });
          } else {
            mar.push(m);
          }
        });
        if (
          payload.recive &&
          payload.sender_user_id !== getUserChat()?.id &&
          mar.filter((S) => S.id === payload.id).length === 0
        ) {
          mar.push({ ...payload, mid: null });
        }
        chatData.push({ ...a, messages: [...mar], id: payload?.channel_id });
      } else {
        chatData.push(a);
      }
    });

    if (state.activeChat && state.activeChat.id && state.activeChat.id === ac) {
      act = {
        ...chatData.filter((a) => a.id === payload?.channel_id)[0],
        id: payload?.channel_id,
      };
    } else {
      if (state.activeChat && state.activeChat.id) {
        act = { ...state.activeChat, id: payload?.channel_id };
      }
    }

    let arr = [];
    chatData.forEach((a) => {
      if (a.id === ac) {
        arr.push(a);
      }
    });
    chatData.forEach((a) => {
      if (a.id !== ac) {
        arr.push(a);
      }
    });

    let news = [];
    if (
      payload.recive &&
      state.activeChat &&
      state.activeChat &&
      payload.cid !== state.activeChat.id
    ) {
      if (state.newChats.filter((a) => a.id === payload.cid).length === 0) {
        news = [
          ...state.newChats,
          state.data.filter((f) => f.id === payload.cid)[0],
        ];
      } else if (!state.activeChat && !state.activeChat.id && payload.recive) {
        news = [
          ...state.newChats,
          state.data.filter((f) => f.id === payload.cid)[0],
        ];
      }
    }
    if (state.activeChat && state.activeChat.id) {
    } else {
      news = [
        ...state.newChats,
        state.data.filter((f) => f.id === payload.cid)[0],
      ];
    }

    set({
      data: [...arr],
      activeChat: act ? { ...act } : null,
      newChats: [...news],
      ref: !state.ref,
      refs: !state.refs,
    });
  },

  setMain: (payload: string) => set({ main: payload }),

  setNameModal: (payload: boolean) => set({ nameModal: payload }),

  setFirebaseToken: (payload: string) => set({ fbToken: payload }),

  setChats: (payload: any[], param: any[]) => {
    const state = get();
    let arr = [];
    let chatData = [];
    let users = [];
    let prr = [];

    payload.forEach((a) => {
      let unique = a.channel_members.filter(
        (df) => df.user_id !== getUserChat()?.id
      )[0];
      users.push(unique.user_id);
      chatData.push({ ...a, messages: a.messages.reverse() });
    });

    let temp = state.activeChat;
    if (
      state.activeChat &&
      state.activeChat.id &&
      payload.filter((a) => a.id === state.activeChat.id).length > 0
    ) {
      temp = payload.filter((a) => a.id === state.activeChat.id)[0];
    }

    if (state.data.length !== payload.length) {
      payload.forEach((adsd) => {
        if (state.data.filter((ch) => ch.id === adsd.id).length === 0) {
          if (
            adsd.messages.filter(
              (mes) =>
                mes.message_status.filter(
                  (st) => st.user_id === getUserChat()?.id
                )[0]?.is_watched === false
            ).length > 0
          ) {
            arr.push(adsd);
          }
        }
      });
    }

    param.forEach((p) => {
      prr.push({ ...p, messages: p.messages.reverse() });
    });

    set({
      data: [...prr, ...chatData],
      activeChat: temp?.id ? { ...temp } : null,
      newChats: arr,
      chatUsers: users,
      chat_loading: true,
    });
  },

  setChatLoading: () => set({ chat_loading: true }),

  setChatDone: () => set({ chat_loading: false }),

  setQouted: (payload: any) => set({ qouted: payload }),

  setPageData: (payload: any) => {
    const state = get();
    let arr = [];
    let active = state.activeChat;
    if (!state.data.find((s) => s.id === payload.ch)) {
      let mrr = [];
      payload.mes.forEach((m) => {
        if (mrr.filter((s) => s.id === m.id).length === 0) {
          mrr = [m, ...mrr];
        }
      });
      active.messages.forEach((m) => {
        if (mrr.filter((s) => s.id === m.id).length === 0) {
          mrr.push(m);
        }
      });
      set({
        activeChat: active,
        fetch: true,
        searchChat: {
          ...state.searchChat,
          loading: false,
        },
        first: false,
        mid: payload.mes.length === 0 ? null : state.mid,
      });
      return;
    }
    state.data.forEach((ch) => {
      if (parseInt(ch.id) === parseInt(payload.ch)) {
        let mrr = [];
        payload.mes.forEach((m) => {
          if (mrr.filter((s) => s.id === m.id).length === 0) {
            mrr = [m, ...mrr];
          }
        });
        ch.messages.forEach((m) => {
          if (mrr.filter((s) => s.id === m.id).length === 0) {
            mrr.push(m);
          }
        });
        arr.push({ ...ch, messages: mrr });
      } else {
        arr.push(ch);
      }
    });

    set({
      data: arr,
      activeChat: arr.filter(
        (s) => parseInt(s.id) === parseInt(state.activeChat.id)
      )[0],
      fetch: true,
      searchChat: {
        ...state.searchChat,
        loading: false,
      },
      first: false,
      mid: payload.mes.length === 0 ? null : state.mid,
    });
  },

  setMessagesPage: (payload: any) =>
    set({
      fetch: false,
      mid: payload,
    }),

  muteChat: (payload: any) => {
    const state = get();
    if (!payload.event) {
      MuteChat(payload);
    }
    let arr = [];
    state.data.forEach((chat) => {
      if (chat.id === payload.id) {
        arr.push({
          ...state.data.filter((s) => s.id === payload.id)[0],
          channel_members: [
            state.data
              .filter((s) => s.id === payload.id)[0]
              ?.channel_members.filter(
                (mem) => mem.user_id !== getUserChat()?.id
              )[0],
            {
              ...state.data
                .filter((s) => s.id === payload.id)[0]
                ?.channel_members.filter(
                  (mem) => mem.user_id === getUserChat()?.id
                )[0],
              mute: payload.value ? 1 : 0,
            },
          ],
        });
      } else {
        arr.push(chat);
      }
    });

    set({ data: arr });
  },

  pinChat: (payload: any) => {
    const state = get();
    if (state.pinnedChats.length < 3) {
      if (!payload.event) {
        PinnChat(payload);
      }
      let arr = [];
      arr = [
        ...state.data.filter((s) => s.id !== payload.id),
        {
          ...state.data.filter((s) => s.id === payload.id)[0],
          channel_members: [
            state.data
              .filter((s) => s.id === payload.id)[0]
              ?.channel_members.filter(
                (mem) => mem.user_id !== getUserChat()?.id
              )[0],
            {
              ...state.data
                .filter((s) => s.id === payload.id)[0]
                ?.channel_members.filter(
                  (mem) => mem.user_id === getUserChat()?.id
                )[0],
              pin: payload.value ? 1 : 0,
            },
          ],
        },
      ];
      set({ data: arr });
    } else {
      const Toast = async () => {
        const { toast } = await import("react-toastify");
        toast.error("only 3 pinned chats allowed");
      };
      Toast();
    }
  },

  setUnreadChat: (payload: any) => {
    const state = get();
    let arr = [];
    state.data.forEach((chat) => {
      if (chat.id === payload.id) {
        arr.push({ ...chat, unread: payload.value });
      } else {
        arr.push(chat);
      }
    });
    set({ data: arr });
  },

  editChatInfo: (payload: any) => {
    const state = get();
    let arr = [];
    let active = state.activeChat;
    state.data.forEach((s) => {
      if (parseInt(s.id) === parseInt(payload.id)) {
        arr.push({ ...s, message_counts: payload.data });
      } else {
        arr.push(s);
      }
    });
    if (active && parseInt(active?.id) === parseInt(payload.id)) {
      active = { ...active, message_counts: payload.data };
    }
    set({ data: arr, activeChat: active });
  },

  editChatInfoMedia: (payload: any) => {
    const state = get();
    let arr = [];
    let active = state.activeChat;
    state.data.forEach((s) => {
      if (parseInt(s.id) === parseInt(payload.id)) {
        arr.push({
          ...s,
          message_counts: {
            ...s.message_counts,
            ...getMediaReducer(payload.media, payload.data),
          },
        });
      } else {
        arr.push(s);
      }
    });
    if (active && parseInt(active?.id) === parseInt(payload.id)) {
      active = {
        ...active,
        message_counts: {
          ...active.message_counts,
          ...getMediaReducer(payload.media, payload.data),
        },
      };
    }
    set({ data: arr, activeChat: active });
  },

  deleteChat: (payload: any) => {
    deleteChat(payload.id);
    set((state) => ({
      data: state.data.filter(
        (chat) => parseInt(chat.id) !== parseInt(payload.id)
      ),
      activeChat: null,
      main: "main",
    }));
  },

  deleteMessage: (payload: any) => {
    const state = get();
    if (
      state.data.filter((chat) => parseInt(chat.id) === parseInt(payload.ch_id))
        .length > 0
    ) {
      let arr = [];
      let bool = payload.bool;
      let active = state.activeChat;
      state.data.forEach((chat) => {
        if (parseInt(chat.id) === parseInt(payload.ch_id)) {
          if (
            state.activeChat?.id &&
            parseInt(state.activeChat.id) === parseInt(payload.ch_id)
          ) {
            active = bool
              ? {
                  ...state.activeChat,
                  messages: active.messages.map((msg) => {
                    if (parseInt(msg.id) !== parseInt(payload.msg_id)) {
                      return msg;
                    } else {
                      return {
                        ...msg,
                        auth_message_status: {
                          ...(msg?.auth_message_status || {}),
                          is_deleted: 1,
                        },
                      };
                    }
                  }),
                }
              : {
                  ...state.activeChat,
                  messages: active.messages.filter(
                    (msg) => parseInt(msg.id) !== parseInt(payload.msg_id)
                  ),
                };
          }
          arr.push({
            ...chat,
            messages: chat.messages.map((msg) => {
              if (parseInt(msg.id) !== parseInt(payload.msg_id)) {
                return msg;
              } else {
                return {
                  ...msg,
                  auth_message_status: {
                    ...(msg?.auth_message_status || {}),
                    is_deleted: 1,
                  },
                };
              }
            }),
          });
        } else {
          arr.push(chat);
        }
      });
      set({
        data: arr,
        activeChat: active,
      });
    }
  },

  deleteCall: (payload: number) =>
    set((state) => ({
      calls: state.calls.filter(
        (call) => parseInt(call.id) !== parseInt(payload.toString())
      ),
    })),

  setReplyMessage: (payload: any) => set({ replyMessage: payload }),
});

// export const ChatReducer = (
//   state = initialState,
//   { type, payload, param, source }
// ) => {
//   switch (type) {
//     case "SET_SERVER_TIME": {
//       return {
//         ...state,
//         Server_time: payload,
//       };
//     }
//     case "STORE-CLIENT": {
//       return {
//         ...state,
//         client: payload,
//       };
//     }
//     case "CALL-LOADING": {
//       return {
//         ...state,
//         callLoading: payload,
//       };
//     }
//     case "CALL_LOADING": {
//       return {
//         ...state,
//         call_loading: payload,
//       };
//     }
//     case "CHAT-OPEN": {
//       if (JSON.parse(localStorage.getItem("USER"))?.name?.length > 2)
//         return {
//           ...state,
//           chatVar: payload,
//         };
//       else {
//         return { ...state, nameModal: true };
//       }
//     }
//     case "SET_LAST_NOTIFICATION_DATE": {
//       return {
//         ...state,
//         lastNotification: payload,
//       };
//     }
//     case "GET_CONTACTS_RED": {
//       return {
//         ...state,
//         contacts: payload,
//       };
//     }
//     case "SEARCH_REDUCER": {
//       return {
//         ...state,
//         searchResults: payload,
//       };
//     }
//     case "FORWARD-MESSAGEs": {
//       return { ...state, forwarded_message: payload, main: "MAIN" };
//     }
//     case "GET_CALLS": {
//       let call_temp = state.calls;
//       payload.map((call) => {
//         if (!state.calls.some((c) => c.id === call.id)) {
//           call_temp.push(call);
//         }
//       });
//       return {
//         ...state,
//         calls: call_temp,
//         call_loading: false,
//       };
//     }
//     case "USER_END_CALL": {
//       if (
//         parseInt(state.MessageActiveCall) === parseInt(payload) ||
//         payload === -1
//       ) {
//         if (state.client) {
//           state.client?.leave();
//           state.client?.removeAllListeners();
//         }
//         return {
//           ...state,
//           call: null,
//           callInProgress: false,
//           isCallIncoming: false,
//           callLoading: false,
//           incomeCallData: null,
//           incomeCallType: null,
//           caller: null,
//           callerChannel: null,
//           MessageActiveCall: null,
//         };
//       } else {
//         return { ...state };
//       }
//     }
//     case "END-CALL": {
//       if (
//         parseInt(state.MessageActiveCall) === parseInt(payload) ||
//         payload === -1
//       ) {
//         if (state.client) {
//           state.client?.leave();
//           state.client?.removeAllListeners();
//         }
//         return {
//           ...state,
//           call: null,
//           callInProgress: false,
//           isCallIncoming: false,
//           callLoading: false,
//           incomeCallData: null,
//           incomeCallType: null,
//           caller: null,
//           callerChannel: null,
//           MessageActiveCall: null,
//         };
//       } else return { ...state };
//     }
//     case "Notification": {
//       return {
//         ...state,
//         NotificationPremission: payload,
//       };
//     }
//     case "VIDEO_CALL": {
//       let newActive = {
//         ...state.activeChat,
//         messages: [
//           ...state.activeChat.messages,
//           { ...source, message_type: { name: "VideoCall" } },
//         ],
//         id: source.channel.id,
//       };
//       let arr = [];
//       if (
//         state.data.filter((m) => parseInt(m.id) === parseInt(source.channel.id))
//           .length === 0
//       ) {
//         arr.push(newActive);
//       }
//       state.data.map((m) => {
//         if (parseInt(m.id) === parseInt(source.channel.id)) {
//           arr.push(newActive);
//         } else {
//           arr.push(m);
//         }
//       });
//       return {
//         ...state,
//         activeChat: newActive,
//         call: "vid-outgoing",
//         callInProgress: true,
//         data: arr,
//         AgoraToken: payload,
//         MessageActiveCall: source.id,
//       };
//     }
//     case "edit-call": {
//       var tempCalls = [];
//       if (
//         state.calls.some((call) => parseInt(call.id) === parseInt(payload.id))
//       ) {
//         state.calls.map((call) => {
//           if (parseInt(call.id) === parseInt(payload.id)) {
//             tempCalls.push(payload);
//           } else {
//             tempCalls.push(call);
//           }
//         });
//       } else {
//         tempCalls = [payload, ...state.calls];
//       }
//       return {
//         ...state,
//         calls: tempCalls,
//       };
//     }
//     case "AUDIO_CALL": {
//       let newActive = {
//         ...state.activeChat,
//         messages: [
//           ...state.activeChat.messages,
//           { ...source, message_type: { name: "VideoCall" } },
//         ],
//         id: source.channel.id,
//       };
//       let arr = [];
//       if (
//         state.data.filter((m) => parseInt(m.id) === parseInt(source.channel.id))
//           .length === 0
//       ) {
//         arr.push(newActive);
//       }
//       state.data.map((m) => {
//         if (parseInt(m.id) === parseInt(source.channel.id)) {
//           arr.push(newActive);
//         } else {
//           arr.push(m);
//         }
//       });
//       return {
//         ...state,
//         call: "aud-outgoing",
//         data: arr,
//         callInProgress: true,
//         activeChat: newActive,
//         AgoraToken: payload,
//         MessageActiveCall: source.id,
//       };
//     }
//     case "REFUSE_CALL": {
//       if (parseInt(payload) === parseInt(state.MessageActiveCall)) {
//         return {
//           ...state,
//           call: false,
//           isCallIncoming: false,
//           incomeCallType: null,
//           incomeCallData: null,
//           caller: null,
//           callerChannel: null,
//         };
//       } else return { ...state };
//     }
//     case "ANSWER_CALL": {
//       if (state.incomeCallType === "audio") {
//         return {
//           ...state,
//           call: "aud-incoming",
//           activeChat: {
//             ...(state.data.filter(
//               (s) => parseInt(s.id) === parseInt(state.callerChannel.id)
//             )[0] || {
//               ...state.callerChannel,
//               channel_name: state.caller?.channel_name,
//               mobile_phone: state.caller?.mobile_phone,
//               photo_path: state.caller?.photo_path,
//             }),
//           },
//           data:
//             state.data.filter(
//               (s) => parseInt(s.id) === parseInt(state.callerChannel.id)
//             ).length === 0
//               ? [
//                   {
//                     ...state.callerChannel,
//                     channel_name: state.caller.channel_name,
//                     mobile_phone: state.caller.mobile_phone,
//                     photo_path: state.caller.photo_path,
//                   },
//                   ...state.data,
//                 ]
//               : state.data,
//           main: "chat",
//           isCallIncoming: false,
//           callInProgress: true,
//           AgoraToken: payload,
//         };
//       } else {
//         return {
//           ...state,
//           call: "vid-incoming",
//           activeChat: {
//             ...state.callerChannel,
//             channel_name: state.caller.channel_name,
//             mobile_phone: state.caller.mobile_phone,
//             photo_path: state.caller.photo_path,
//           },
//           data:
//             state.data.filter(
//               (s) => parseInt(s.id) === parseInt(state.callerChannel.id)
//             ).length === 0
//               ? [
//                   {
//                     ...state.callerChannel,
//                     channel_name: state.caller.channel_name,
//                     mobile_phone: state.caller.mobile_phone,
//                     photo_path: state.caller.photo_path,
//                   },
//                   ,
//                   ...state.data,
//                 ]
//               : state.data,
//           main: "chat",
//           isCallIncoming: false,
//           callInProgress: true,
//           AgoraToken: payload,
//         };
//       }
//     }
//     case "USER_ANSWER_CALL": {
//       return {
//         ...state,
//         isCallIncoming: false,
//       };
//     }
//     case "INCOMING_VOICE_CALL": {
//       {
//         return {
//           ...state,
//           isCallIncoming: true,
//           MessageActiveCall: payload.message_id,
//           incomeCallData: payload,
//           caller: payload.caller,
//           callerChannel: payload.callerChannel,
//           incomeCallType: "audio",
//         };
//       }
//     }
//     case "INCOMING_CALL": {
//       {
//         return {
//           ...state,
//           isCallIncoming: true,
//           incomeCallData: payload,
//           MessageActiveCall: payload.message_id,
//           caller: payload.caller,
//           callerChannel: payload.callerChannel,
//           incomeCallType: "video",
//         };
//       }
//     }
//     case "CALL": {
//       let pa = null;
//       if (payload) {
//         pa = state.data.filter(
//           (s) => s.pusher_channel_name === payload.channel
//         )[0];
//       }
//       return {
//         ...state,
//         call: pa,
//       };
//     }
//     case "CHAT-SEARCH-VALUE": {
//       return {
//         ...state,
//         search: {
//           ...state.search,
//           searchValue: payload,
//         },
//       };
//     }
//     case "CHAT-SEARCH-REQUEST": {
//       return {
//         ...state,
//         search: {
//           ...state.search,
//           loading: false,
//           messages: payload.messages,
//           activeMessage: payload.messages[payload.messages.length - 1] ?? null,
//         },
//       };
//     }
//     case "CHAT-SEARCH-ID": {
//       return {
//         ...state,
//         search: {
//           ...state.search,
//           activeMessage: payload,
//         },
//       };
//     }
//     case "CHAT-SEARCH-LOADING": {
//       return {
//         ...state,
//         search: {
//           ...state.search,
//           loading: payload,
//         },
//       };
//     }

//     case "SEND_MES_RED_NEW": {
//       return {
//         ...state,
//         activeChat:
//           state.activeChat.id === payload.channel.mid
//             ? { ...state.activeChat, ...payload.channel }
//             : state.activeChat,
//         data: [
//           {
//             ...state.data.filter((c) => c.id === payload.channel.mid)[0],
//             ...payload.channel,
//           },
//           ...state.data.filter((c) => c.id !== payload.channel.mid),
//         ],
//         main: "chat",
//         ref: !state.ref,
//       };
//     }

//     case "REFS": {
//       return {
//         ...state,
//         refs: !state.refs,
//         ref: !state.ref,
//       };
//     }
//     case "IS_TYPING_TRUE": {
//       let id = payload.id;
//       let active = state.activeChat;
//       let chs = [];

//       state.data.map((ch) => {
//         if (parseInt(id) === parseInt(ch.id))
//           chs.push({
//             ...ch,
//             status: payload.desc,
//             activeDate: payload?.date || ch.activeDate,
//           });
//         else chs.push(ch);
//       });
//       if (state.activeChat && parseInt(state.activeChat.id) === parseInt(id)) {
//         active = {
//           ...state.activeChat,
//           status: payload.desc,
//           activeDate: payload?.date || state.activeChat.activeDate,
//         };
//       }
//       return {
//         ...state,
//         data: [...chs],
//         activeChat: active || state.activeChat,
//       };
//     }
//     case "WATCH_CHANNEL_RED": {
//       let id = parseInt(payload);
//       let newChats = [];
//       let active = null;
//       state.data.map((a) => {
//         if (parseInt(a.id) === id) {
//           let m = [];
//           a.messages.map((mes) => {
//             let newst = [];
//             let st = mes.message_status;
//             if (mes.sender_user_id && !mes.message_type.name.includes("Call"))
//               st.map((sta) => {
//                 let newdate = new Date(
//                   new Date().getTime() - 3 * 60 * 60 * 1000
//                 );
//                 if (sta.user_id !== getUserChat()?.id) {
//                   newst.push({
//                     ...sta,
//                     is_watched: true,
//                     watched_at: sta.watched_at
//                       ? sta.watched_at
//                       : newdate.toLocaleString().toString(),
//                   });
//                 } else {
//                   if (sta.watched_at)
//                     newst.push({ ...sta, is_watched: true, is_received: 1 });
//                   else
//                     newst.push({
//                       ...sta,
//                       is_watched: true,
//                       is_received: 1,
//                       watched_at: new Date(
//                         new Date().getTime() - 3 * 60 * 60 * 1000
//                       )
//                         .toLocaleString()
//                         .toString(),
//                     });
//                 }
//               });
//             if (mes.sender_user_id !== getUserChat()?.id)
//               newst = mes.message_status;
//             m.push({ ...mes, message_status: newst });
//           });
//           newChats.push({ ...a, messages: m });
//           if (state.activeChat && state.activeChat.id) {
//             active = state.activeChat;
//             if (parseInt(active.id) === parseInt(payload)) {
//               active = { ...a, messages: m };
//             }
//           }
//         } else {
//           newChats.push(a);
//         }
//       });
//       return {
//         ...state,
//         data: newChats,
//         activeChat: active,
//         newChats: state.newChats.filter((a) => parseInt(a.id) !== payload),
//       };
//     }
//     case "WATCH_CHANNEL": {
//       let id = parseInt(payload);
//       if (
//         (typeof payload === "string" && !payload.includes("ch")) ||
//         typeof payload === "number"
//       )
//         watchChannel(payload);
//       let newChats = [];
//       let active = state.activeChat;
//       if (
//         state.data.filter((s) => parseInt(s.id) === parseInt(id.toString())).length > 0 ||
//         (typeof payload === "string" && payload.includes("ch"))
//       ) {
//         state.data.map((a) => {
//           if (parseInt(a.id) === id) {
//             let m = [];
//             a.messages.map((mes) => {
//               let newst = [];
//               let st = mes.message_status;
//               if (mes.sender_user_id && !mes.message_type.name.includes("Call"))
//                 st.map((sta) => {
//                   let newdate = new Date(
//                     new Date().getTime() - 3 * 60 * 60 * 1000
//                   )
//                     .toLocaleString()
//                     .toString();
//                   if (sta.user_id !== getUserChat()?.id) {
//                     newst.push({
//                       ...sta,
//                       is_watched: true,
//                       watched_at: sta.watched_at
//                         ? sta.watched_at
//                         : newdate.toLocaleString().toString(),
//                     });
//                   } else {
//                     if (sta.watched_at)
//                       newst.push({ ...sta, is_watched: true, is_received: 1 });
//                     else
//                       newst.push({
//                         ...sta,
//                         is_watched: true,
//                         is_received: 1,
//                         watched_at: new Date(
//                           new Date().getTime() - 3 * 60 * 60 * 1000
//                         )
//                           .toLocaleString()
//                           .toString(),
//                       });
//                   }
//                 });
//               if (
//                 mes.sender_user_id === getUserChat()?.id &&
//                 !mes.message_type.name.includes("Call")
//               )
//                 newst = mes.message_status;
//               m.push({ ...mes, message_status: newst });
//             });
//             newChats.push({ ...a, messages: m });
//             if (state.activeChat && state.activeChat.id) {
//               active = state.activeChat;
//               if (parseInt(active.id) === parseInt(payload)) {
//                 active = { ...a, messages: m };
//               }
//             }
//           } else {
//             newChats.push(a);
//           }
//         });

//         return {
//           ...state,
//           data: newChats,
//           activeChat: active?.id ? active : state.activeChat,
//           newChats: state.newChats.filter(
//             (a) => parseInt(a.id) !== parseInt(payload)
//           ),
//         };
//       } else {
//         return {
//           ...state,
//         };
//       }
//     }
//     case "REC_CHANNEL_RED": {
//       let id = parseInt(payload);
//       if (
//         (typeof payload === "string" && !payload.includes("ch")) ||
//         typeof payload === "number"
//       )
//         Recive(payload);
//       let newChats = [];
//       let active = state.activeChat;
//       state.data.map((a) => {
//         if (parseInt(a.id) === id) {
//           let m = [];
//           a.messages.map((mes) => {
//             let newst = [];
//             let st = mes.message_status;
//             if (mes.sender_user_id && !mes.message_type.name.includes("Call"))
//               st.map((sta) => {
//                 let newdate = new Date(
//                   new Date().getTime() - 3 * 60 * 60 * 1000
//                 );
//                 if (sta.user_id !== getUserChat()?.id) {
//                   newst.push({
//                     ...sta,
//                     is_received: 1,
//                     received_at: sta.received_at
//                       ? sta.received_at
//                       : newdate.toLocaleString().toString(),
//                   });
//                 } else {
//                   if (sta.received_at) newst.push({ ...sta, is_received: 1 });
//                   else
//                     newst.push({
//                       ...sta,
//                       is_received: 1,
//                       received_at: new Date(
//                         new Date().getTime() - 3 * 60 * 60 * 1000
//                       )
//                         .toLocaleString()
//                         .toString(),
//                     });
//                 }
//               });
//             m.push({ ...mes, message_status: newst });
//           });
//           newChats.push({ ...a, messages: m });
//           if (state.activeChat && state.activeChat.id) {
//             active = state.activeChat;
//             if (parseInt(active.id) === parseInt(payload)) {
//               active = { ...a, messages: m };
//             }
//           }
//         } else {
//           newChats.push(a);
//         }
//       });
//       return {
//         ...state,
//         data: newChats,
//         activeChat: active,
//         newChats: [...state.newChats],
//       };
//     }
//     case "OPEN-CHAT": {
//       if (
//         payload &&
//         payload.id &&
//         !(typeof payload.id === "string" && payload.id?.includes("ch"))
//       ) {
//         let s = state.newChats.filter((a) => a.id !== payload.id);
//         return {
//           ...state,
//           activeChat:
//             state.data.filter((a) => a.id === payload.id).length > 0
//               ? state.data.filter((a) => a.id === payload.id)[0]
//               : payload,
//           newChats: [...s],
//           openChat: Math.random(),
//         };
//       } else {
//         return {
//           ...state,
//           activeChat: payload,
//           newChats: state.newChats,
//           fetch: true,
//           first: true,
//           mid: null,
//         };
//       }
//     }
//     case "SEND-MESSAGE": {
//       let ac = payload.act;

//       let chat = state.data;
//       let arr = [];
//       if (payload.isNew || payload.act?.id?.includes("ch")) {
//         arr.push({
//           ...payload.act,
//           messages: [...ac.messages, payload.message],
//         });
//         arr = [...arr, ...chat];
//         return {
//           ...state,
//           data: arr,
//           activeChat:
//             state.activeChat && state.activeChat?.id === ac.id
//               ? arr.filter((t) => t.id === state.activeChat?.id)[0]
//               : state.activeChat,
//           ref: !state.ref,
//           refs: !state.refs,
//           replyMessage: null,
//         };
//       } else {
//         chat.map((a) => {
//           if (
//             parseInt(a.id) === parseInt(ac.id) &&
//             a.messages.filter(
//               (m) => m.id && parseInt(m?.id) === parseInt(payload.message?.id)
//             ).length === 0
//           ) {
//             a.messages.push(payload.message);
//           }
//         });

//         chat.map((a) => {
//           if (parseInt(a.id) === parseInt(ac.id)) {
//             arr.push(a);
//           }
//         });
//         chat.map((a) => {
//           if (parseInt(a.id) !== parseInt(ac.id)) {
//             arr.push(a);
//           }
//         });
//         return {
//           ...state,
//           data: arr,
//           activeChat:
//             state.activeChat &&
//             parseInt(state.activeChat?.id) === parseInt(ac.id)
//               ? arr.filter(
//                   (t) =>
//                     parseInt(t.id) === parseInt(state.activeChat?.id) ||
//                     t.mid === state.activeChat?.mid
//                 )[0]
//               : state.activeChat,
//           ref: !state.ref,
//           refs: !state.refs,
//           replyMessage: null,
//         };
//       }
//     }
//     case "SEND_MES_RED": {
//       let ac = payload.cid;

//       let chat = state.data;
//       let act = null;
//       let chatData = [];

//       chat.map((a) => {
//         if (a.id === ac) {
//           let mar = [];
//           let sele = a.messages;
//           sele.map((m) => {
//             if (
//               m.mid &&
//               m.mid === payload.mid &&
//               mar.filter((S) => S.id === payload.id).length === 0
//             ) {
//               mar.push({
//                 ...payload,
//                 message_status: m.message_status,
//                 mid: null,
//               });
//             } else {
//               mar.push(m);
//             }
//           });
//           if (
//             payload.recive &&
//             payload.sender_user_id !== getUserChat()?.id &&
//             mar.filter((S) => S.id === payload.id).length === 0
//           ) {
//             mar.push({ ...payload, mid: null });
//           }
//           chatData.push({ ...a, messages: [...mar], id: payload?.channel_id });
//         } else {
//           chatData.push(a);
//         }
//       });
//       if (
//         state.activeChat &&
//         state.activeChat.id &&
//         state.activeChat.id === ac
//       ) {
//         act = {
//           ...chatData.filter((a) => a.id === payload?.channel_id)[0],
//           id: payload?.channel_id,
//         };
//       } else {
//         if (state.activeChat && state.activeChat.id) {
//           act = { ...state.activeChat, id: payload?.channel_id };
//         }
//       }
//       let arr = [];
//       chatData.map((a) => {
//         if (a.id === ac) {
//           arr.push(a);
//         }
//       });
//       chatData.map((a) => {
//         if (a.id !== ac) {
//           arr.push(a);
//         }
//       });
//       let news = [];
//       if (
//         payload.recive &&
//         state.activeChat &&
//         state.activeChat &&
//         payload.cid !== state.activeChat.id
//       ) {
//         if (state.newChats.filter((a) => a.id === payload.cid).length === 0)
//           news = [
//             ...state.newChats,
//             state.data.filter((f) => f.id === payload.cid)[0],
//           ];
//         else if (!state.activeChat && !state.activeChat.id && payload.recive)
//           news = [
//             ...state.newChats,
//             state.data.filter((f) => f.id === payload.cid)[0],
//           ];
//       }
//       if (state.activeChat && state.activeChat.id) {
//       } else {
//         news = [
//           ...state.newChats,
//           state.data.filter((f) => f.id === payload.cid)[0],
//         ];
//       }

//       return {
//         ...state,
//         data: [...arr],
//         activeChat: act ? { ...act } : null,
//         newChats: [...news],
//         ref: !state.ref,
//         refs: !state.refs,
//       };
//     }
//     case "MAIN": {
//       return {
//         ...state,
//         main: payload,
//       };
//     }
//     case "SHOW-MODAL": {
//       return {
//         ...state,
//         nameModal: payload,
//       };
//     }
//     case "STORE_TOKEN_RED": {
//       return {
//         ...state,
//         fbToken: payload,
//       };
//     }
//     case "GET_CHAT_RED": {
//       let arr = [];
//       let chatData = [];
//       let users = [];
//       let prr = [];
//       payload.map((a) => {
//         let unique = a.channel_members.filter(
//           (df) => df.user_id !== getUserChat()?.id
//         )[0];
//         users.push(unique.user_id);
//         chatData.push({ ...a, messages: a.messages.reverse() });
//       });
//       let temp = state.activeChat;
//       if (
//         state.activeChat &&
//         state.activeChat.id &&
//         payload.filter((a) => a.id === state.activeChat.id).length > 0
//       ) {
//         temp = payload.filter((a) => a.id === state.activeChat.id)[0];
//       }
//       if (state.data.length !== payload.length) {
//         payload.map((adsd) => {
//           if (state.data.filter((ch) => ch.id === adsd.id).length === 0) {
//             if (
//               adsd.messages.filter(
//                 (mes) =>
//                   mes.message_status.filter(
//                     (st) => st.user_id === getUserChat()?.id
//                   )[0]?.is_watched === false
//               ).length > 0
//             )
//               arr.push(adsd);
//           }
//         });
//       }
//       param.map((p) => {
//         prr.push({ ...p, messages: p.messages.reverse() });
//       });
//       return {
//         ...state,
//         data: [...prr, ...chatData],
//         activeChat: temp?.id ? { ...temp } : null,
//         newChats: arr,
//         chatUsers: users,
//         loading: true,
//       };
//     }
//     case "CHAT_LOADING": {
//       return {
//         ...state,
//         loading: true,
//       };
//     }
//     case "CHAT_DONE": {
//       return {
//         ...state,
//         loading: false,
//       };
//     }
//     case "DEL_CHAT": {
//       return {
//         ...state,
//         data: state.data.filter((a) => a.id !== payload),
//       };
//     }
//     case "qouted": {
//       return {
//         ...state,
//         qouted: payload,
//       };
//     }
//     case "GRP": {
//       let arr = [];
//       let active = state.activeChat;

//       state.data.map((ch) => {
//         if (parseInt(ch.id) === parseInt(payload.ch)) {
//           let mrr = [];
//           payload.mes.map((m) => {
//             if (mrr.filter((s) => s.id === m.id).length === 0) {
//               mrr = [m, ...mrr];
//             }
//           });
//           ch.messages.map((m) => {
//             if (mrr.filter((s) => s.id === m.id).length === 0) {
//               mrr.push(m);
//             }
//           });
//           arr.push({ ...ch, messages: mrr });
//         } else {
//           arr.push(ch);
//         }
//       });
//       return {
//         ...state,
//         data: arr,
//         activeChat: arr.filter(
//           (s) => parseInt(s.id) === parseInt(state.activeChat.id)
//         )[0],
//         fetch: true,
//         search: {
//           ...state.search,
//           loading: false,
//         },
//         first: false,
//         mid: payload.mes.length === 0 ? null : state.mid,
//       };
//     }

//     case "GET_CHAT_PAGE": {
//       return {
//         ...state,
//         fetch: false,
//         mid: payload,
//       };
//     }
//     case "MUTE_CHAT_REDUCER": {
//       if (!payload.event) {
//         MuteChat(payload);
//       }
//       let arr = [];
//       state.data.map((chat) => {
//         if (chat.id === payload.id) {
//           arr.push({
//             ...state.data.filter((s) => s.id === payload.id)[0],
//             channel_members: [
//               state.data
//                 .filter((s) => s.id === payload.id)[0]
//                 ?.channel_members.filter(
//                   (mem) => mem.user_id !== getUserChat()?.id
//                 )[0],
//               {
//                 ...state.data
//                   .filter((s) => s.id === payload.id)[0]
//                   ?.channel_members.filter(
//                     (mem) => mem.user_id === getUserChat()?.id
//                   )[0],
//                 mute: payload.value ? 1 : 0,
//               },
//             ],
//           });
//         } else {
//           arr.push(chat);
//         }
//       });

//       return {
//         ...state,
//         data: arr,
//       };
//     }
//     case "PIN_CHAT_REDUCER": {
//       if (state.pinnedChats.length < 3) {
//         if (!payload.event) {
//           PinnChat(payload);
//         }
//         let arr = [];
//         arr = [
//           ...state.data.filter((s) => s.id !== payload.id),
//           {
//             ...state.data.filter((s) => s.id === payload.id)[0],
//             channel_members: [
//               state.data
//                 .filter((s) => s.id === payload.id)[0]
//                 ?.channel_members.filter(
//                   (mem) => mem.user_id !== getUserChat()?.id
//                 )[0],
//               {
//                 ...state.data
//                   .filter((s) => s.id === payload.id)[0]
//                   ?.channel_members.filter(
//                     (mem) => mem.user_id === getUserChat()?.id
//                   )[0],
//                 pin: payload.value ? 1 : 0,
//               },
//             ],
//           },
//         ];
//         return {
//           ...state,
//           data: arr,
//         };
//       } else {
//         Toast();
//         return {
//           ...state,
//         };
//       }
//     }
//     case "UNREAD_CHAT_REDUCER": {
//       let arr = [];
//       state.data.map((chat) => {
//         if (chat.id === payload.id) {
//           arr.push({ ...chat, unread: payload.value });
//         } else arr.push(chat);
//       });
//       return {
//         ...state,
//         data: arr,
//       };
//     }
//     case "EDIT_CHAT_INFO": {
//       let arr = [];
//       let active = state.activeChat;
//       state.data.map((s) => {
//         if (parseInt(s.id) === parseInt(payload.id)) {
//           arr.push({ ...s, message_counts: payload.data });
//         } else {
//           arr.push(s);
//         }
//       });
//       if (active && parseInt(active?.id) === parseInt(payload.id)) {
//         active = { ...active, message_counts: payload.data };
//       }
//       return { ...state, data: arr, activeChat: active };
//     }
//     case "EDIT_CHAT_INFO_MEDIA": {
//       let arr = [];
//       let active = state.activeChat;
//       state.data.map((s) => {
//         if (parseInt(s.id) === parseInt(payload.id)) {
//           arr.push({
//             ...s,
//             message_counts: {
//               ...s.message_counts,
//               ...getMediaReducer(payload.media, payload.data),
//             },
//           });
//         } else {
//           arr.push(s);
//         }
//       });
//       if (active && parseInt(active?.id) === parseInt(payload.id)) {
//         active = {
//           ...active,
//           message_counts: {
//             ...s.message_counts,
//             ...getMediaReducer(payload.media, payload.data),
//           },
//         };
//       }
//       return { ...state, data: arr, activeChat: active };
//     }
//     case "DELETE_CHAT_REDUCER": {
//       deleteChat(payload.id);
//       return {
//         ...state,
//         data: state.data.filter(
//           (chat) => parseInt(chat.id) !== parseInt(payload.id)
//         ),
//         activeChat: null,
//         main: "main",
//       };
//     }
//     case "DELETE_MESSAGE": {
//       if (
//         state.data.filter(
//           (chat) => parseInt(chat.id) === parseInt(payload.ch_id)
//         ).length > 0
//       ) {
//         let arr = [];
//         let bool = payload.bool;
//         let active = state.activeChat;
//         state.data.map((chat) => {
//           if (parseInt(chat.id) === parseInt(payload.ch_id)) {
//             if (
//               state.activeChat?.id &&
//               parseInt(state.activeChat.id) === parseInt(payload.ch_id)
//             ) {
//               active = bool
//                 ? {
//                     ...state.activeChat,
//                     messages: active.messages.map((msg) => {
//                       if (parseInt(msg.id) !== parseInt(payload.msg_id)) {
//                         return msg;
//                       } else {
//                         return {
//                           ...msg,
//                           auth_message_status: {
//                             ...(msg?.auth_message_status || {}),
//                             is_deleted: 1,
//                           },
//                         };
//                       }
//                     }),
//                   }
//                 : {
//                     ...state.activeChat,
//                     messages: active.messages.filter(
//                       (msg) => parseInt(msg.id) !== parseInt(payload.msg_id)
//                     ),
//                   };
//             }
//             arr.push({
//               ...chat,
//               messages: chat.messages.map((msg) => {
//                 if (parseInt(msg.id) !== parseInt(payload.msg_id)) {
//                   return msg;
//                 } else {
//                   return {
//                     ...msg,
//                     auth_message_status: {
//                       ...(msg?.auth_message_status || {}),
//                       is_deleted: 1,
//                     },
//                   };
//                 }
//               }),
//             });
//           } else {
//             arr.push(chat);
//           }
//         });
//         return {
//           ...state,
//           data: arr,
//           activeChat: active,
//         };
//       }
//     }
//     case "DELETE_CALL": {
//       return {
//         ...state,
//         calls: state.calls.filter(
//           (call) => parseInt(call.id) !== parseInt(payload)
//         ),
//       };
//     }
//     case "REPLY-MESSAGE": {
//       return {
//         ...state,
//         replyMessage: payload,
//       };
//     }
//     default:
//       return state;
//   }
// };
