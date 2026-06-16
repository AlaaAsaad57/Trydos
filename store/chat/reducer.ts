import { getUserChat, translateFunction as translate } from "utils/functions";
import { Recive, watchChannel as watchChannelAction } from "./actions";
import { getMediaReducer } from "./actions";
import { showErrorNotification } from "@/store/notifications/reducer";
import { Channel } from "utils/types/chat";

// --- Types ---
interface ChatState {
  chatVar: boolean;
  data: Channel[];
  MessageActiveCall: number | null;
  activeChat: Channel | null;
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
  } | null;
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
  isNotificationModal: boolean;
  showNotificaionCircle: {
    order_id: number;
    chat_id: number;
    order_group_id: string;
  }[];
  tracks: any[];
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
  showNotificaionCircle: [],
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
  caller: { channel_name: "", mobile_phone: "", photo_path: null },
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
  isNotificationModal: false,
  tracks: [],
};

// --- Helpers (Performance & DRY) ---

/**
 * Safely compares two IDs that might be strings or numbers.
 */
const areIdsEqual = (a: any, b: any): boolean => {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  return String(a) === String(b);
};

/**
 * Updates a specific channel in the data array and syncs activeChat if it matches.
 * Returns the new partial state to be passed to set().
 */
const updateDataAndActiveChat = (
  state: ChatState,
  channelId: string | number,
  updateFn: (channel: Channel) => Channel,
): Partial<ChatState> => {
  let channelFound = false;

  const newData = state.data.map((ch: any) => {
    if (areIdsEqual(ch.id, channelId)) {
      channelFound = true;
      return updateFn(ch);
    }
    return ch;
  });

  // If the active chat is the one being updated, apply the update to it as well
  let newActiveChat = state.activeChat;
  if (state.activeChat && areIdsEqual(state.activeChat.id, channelId)) {
    // If we already updated it in the loop, find it (to share reference), otherwise calculate
    const foundInNewData = newData.find((c: any) =>
      areIdsEqual(c.id, channelId),
    );
    newActiveChat = foundInNewData || updateFn(state.activeChat);
  }

  // If the channel wasn't in data (rare but possible in original code), handle outside
  if (
    !channelFound &&
    state.activeChat &&
    areIdsEqual(state.activeChat.id, channelId)
  ) {
    newActiveChat = updateFn(state.activeChat);
  }

  return { data: newData, activeChat: newActiveChat };
};

/**
 * Calculates the 'watched_at' or 'received_at' date logic.
 * Original code subtracted 3 hours (3*60*60*1000).
 */
const getAdjustedDateString = (originalDate?: string): string => {
  if (originalDate) return originalDate;
  // 3 hours offset as per original code
  return new Date(new Date().getTime() - 10800000).toLocaleString().toString();
};

/**
 * Core logic for updating message statuses (Read/Received).
 * Used by watchChannelEvent, watchChannel, and receiveChannelEvent.
 */
const processMessageStatuses = (
  messages: any[],
  type: "watch" | "receive",
  watchForSender: boolean,
): any[] => {
  let currentUserId = getUserChat()?.id;
  return messages.map((mes) => {
    if (mes.sender_user_id && !mes.message_type?.name?.includes("Call")) {
      // If we are watching/receiving events and we are the sender, we don't update our own status
      // strictly based on the loop logic in original code, unless specific conditions met.
      // However, the original code logic was slightly convoluted.
      // Refactored to map the status array:

      const newStatuses = mes.message_status.map((sta: any) => {
        const isSelfStatus = sta.user_id === currentUserId;
        if (watchForSender) {
          if (isSelfStatus) {
            if (type === "watch")
              return {
                ...sta,
                is_watched: true,
                watched_at: getAdjustedDateString(sta.watched_at),
              };
            if (type === "receive")
              return {
                ...sta,
                is_received: 1,
                received_at: getAdjustedDateString(sta.received_at),
              };
          }
        } else {
          if (!isSelfStatus) {
            if (type === "watch")
              return {
                ...sta,
                is_watched: true,
                watched_at: getAdjustedDateString(sta.watched_at),
              };
            if (type === "receive")
              return {
                ...sta,
                is_received: 1,
                received_at: getAdjustedDateString(sta.received_at),
              };
          }
        }
        // Logic for "Watch" (Read)
        // if (type === "watch") {
        //   if (!isSelfStatus) {
        //     return {
        //       ...sta,
        //       is_watched: true,
        //       watched_at: getAdjustedDateString(sta.watched_at),
        //     };
        //   } else {
        //     // For self, ensure is_received is 1 if watched
        //     const defaults = { is_watched: true, is_received: 1 };
        //     return {
        //       ...sta,
        //       ...defaults,
        //       watched_at: getAdjustedDateString(sta.watched_at),
        //     };
        //   }
        // }

        // // Logic for "Receive" (Delivered)
        // if (type === "receive") {
        //   if (!isSelfStatus) {
        //     return {
        //       ...sta,
        //       is_received: 1,
        //       received_at: getAdjustedDateString(sta.received_at),
        //     };
        //   } else {
        //     return {
        //       ...sta,
        //       is_received: 1,
        //       received_at: getAdjustedDateString(sta.received_at),
        //     };
        //   }
        // }
        return sta;
      });

      // Original code quirk: if NOT sender, replace status.
      // If sender AND type is 'watch', original code conditionally replaced it.
      // Simplification:
      return { ...mes, message_status: newStatuses };
    }
    return mes;
  });
};

// --- Store Implementation ---

export const useChatStore = (set: any, get: any) => ({
  ...initialState,

  setServerTime: (payload: any) => set({ Server_time: payload }),

  storeClient: (payload: any) => {
    const current = get().client;
    if (current !== payload) set({ client: payload });
  },

  storeTrack: (payload: any) => {
    const current = get().tracks;
    if (current !== payload) set({ tracks: payload });
  },

  setCallLoading: (payload: any) => set({ callLoading: payload }),
  setCallLoadingState: (payload: boolean) => set({ call_loading: payload }),

  setChatOpen: (payload: boolean) => {
    if (payload === false) {
      set({ chatVar: false, activeChat: null, main: "main" });
      return;
    }
    const userName = get().userProfile?.name;
    if (userName?.length > 0) {
      set({ chatVar: payload });
    } else {
      set({ nameModal: true });
    }
  },

  setLastNotificationDate: (payload: any) => set({ lastNotification: payload }),
  setContacts: (payload: any[]) => set({ contacts: payload }),
  setChatSearchResults: (payload: any[]) => set({ chatSearchResults: payload }),
  setForwardMessage: (payload: any) =>
    set({ forwarded_message: payload, main: "MAIN" }),

  setCalls: (payload: any[]) => {
    const currentCalls = get().calls;
    // Perf: Use Map for O(1) checks instead of .some() inside loop
    const existingIds = new Set(currentCalls.map((c: any) => c.id));
    const newCalls = [...currentCalls];

    payload.forEach((call) => {
      if (!existingIds.has(call.id)) {
        newCalls.push(call);
      }
    });
    set({ calls: newCalls, call_loading: false });
  },

  endCall: (payload: number) => {
    const state = get();
    // Normalize logic
    const activeCallId = state.MessageActiveCall
      ? parseInt(state.MessageActiveCall.toString())
      : 0;
    const payloadId = parseInt(payload.toString());

    if (activeCallId === payloadId || payload === -1) {
      state.client?.leave();
      state.client?.removeAllListeners();

      state.tracks?.forEach((track: any) => {
        track?.close();
        track?.stop();
      });

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
        tracks: [],
      });
    }
  },

  storeDuration: (msgId: any, duration: any) => {
    const state = get();
    // Only proceed if activeChat exists
    if (!state.activeChat) return;

    // Use Helper
    set(
      updateDataAndActiveChat(state, state.activeChat.id, (channel) => ({
        ...channel,
        messages: channel.messages.map((m) =>
          areIdsEqual(m.id, msgId)
            ? { ...m, duration_in_seconds: duration }
            : m,
        ),
      })),
    );
  },

  setNotificationModal: (e: any) => set({ isNotificationModal: e }),
  setNotificationPermission: (payload: boolean) =>
    set({ NotificationPremission: payload }),

  setVideoCall: (payload: any, source: any) => {
    const state = get();
    const messageType = "VideoCall";
    const newMessage = { ...source, message_type: { name: messageType } };

    // Common logic for initiating call (DRY for Video/Audio)
    const exists = state.data.some((m: any) =>
      areIdsEqual(m.id, source.channel.id),
    );
    let newActive = { ...state.activeChat };

    if (
      state.activeChat &&
      areIdsEqual(state.activeChat.id, source.channel.id)
    ) {
      newActive.messages = [...state.activeChat.messages, newMessage];
    } else {
      // Fallback if source isn't active
      newActive = {
        ...source.channel,
        messages: [newMessage],
        id: source.channel.id,
      };
    }

    let newData = state.data;
    if (!exists) {
      newData = [newActive, ...state.data];
    } else {
      // Update existing
      newData = state.data.map((m: any) =>
        areIdsEqual(m.id, source.channel.id) ? newActive : m,
      );
    }

    set({
      activeChat: newActive,
      call: "vid-outgoing",
      callInProgress: true,
      data: newData,
      AgoraToken: payload,
      MessageActiveCall: source.id,
    });
  },

  editCall: (payload: any) => {
    const state = get();
    let tempCalls;
    const exists = state.calls.some((call: any) =>
      areIdsEqual(call.id, payload.id),
    );

    if (exists) {
      tempCalls = state.calls.map((call: any) =>
        areIdsEqual(call.id, payload.id) ? payload : call,
      );
    } else {
      tempCalls = [payload, ...state.calls];
    }
    set({ calls: tempCalls });
  },

  setAudioCall: (payload: any, source: any) => {
    const state = get();
    const messageType = "VoiceCall";
    const newMessage = { ...source, message_type: { name: messageType } };

    const exists = state.data.some((m: any) =>
      areIdsEqual(m.id, source.channel.id),
    );
    let newActive = { ...state.activeChat };

    // Determine Active Chat Object
    if (
      state.activeChat &&
      areIdsEqual(state.activeChat.id, source.channel.id)
    ) {
      newActive = {
        ...state.activeChat,
        messages: [...state.activeChat.messages, newMessage],
        id: source.channel.id,
      };
    } else {
      newActive = {
        ...source.channel,
        messages: [newMessage],
        id: source.channel.id,
      };
    }

    let newData = state.data;
    if (!exists) {
      newData = [newActive, ...state.data];
    } else {
      newData = state.data.map((m: any) =>
        areIdsEqual(m.id, source.channel.id) ? newActive : m,
      );
    }

    set({
      call: "aud-outgoing",
      data: newData,
      callInProgress: true,
      activeChat: newActive,
      AgoraToken: payload,
      MessageActiveCall: source.id,
    });
  },

  refuseCall: (payload: number) => {
    const state = get();
    if (areIdsEqual(payload, state.MessageActiveCall || "0")) {
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
    const callerChannelId = state.callerChannel?.id;

    // Fallback object creation
    const fallbackChat = {
      ...state.callerChannel,
      channel_name: state.caller?.channel_name,
      mobile_phone: state.caller?.mobile_phone,
      photo_path: state.caller?.photo_path,
    };

    const foundChat = state.data.find((s: any) =>
      areIdsEqual(s.id, callerChannelId),
    );
    const activeChat = foundChat || fallbackChat;

    const newData = foundChat ? state.data : [activeChat, ...state.data];

    const callType =
      state.incomeCallType === "audio" ? "aud-incoming" : "vid-incoming";

    set({
      call: callType,
      activeChat,
      data: newData,
      main: "chat",
      isCallIncoming: false,
      callInProgress: true,
      AgoraToken: payload,
    });
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
      ? state.data.find(
          (s: any) => s.pusher_channel_name === payload.channel,
        ) || null
      : null;
    set({ call: pa });
  },

  setChatSearchValue: (payload: string) =>
    set((state: ChatState) => ({
      searchChat: { ...state.searchChat, searchValue: payload },
    })),

  setChatSearchRequest: (payload: any) =>
    set((state: ChatState) => ({
      searchChat: {
        ...state.searchChat,
        loading: false,
        messages: payload.messages,
        activeMessage: payload.messages[payload.messages.length - 1] ?? null,
      },
    })),

  setChatSearchId: (payload: any) =>
    set((state: ChatState) => ({
      searchChat: { ...state.searchChat, activeMessage: payload },
    })),

  setChatSearchLoading: (payload: boolean) =>
    set((state: ChatState) => ({
      searchChat: { ...state.searchChat, loading: payload },
    })),

  sendNewMessage: (payload: any) =>
    set((state: ChatState) => {
      // Optimized: Only filter once
      const channelId = payload.channel.mid;
      const otherChannels = state.data.filter((c: any) => c.id !== channelId);
      const existingChannel =
        state.data.find((c: any) => c.id === channelId) || {};

      const updatedChannel = { ...existingChannel, ...payload.channel };
      const isActive = state.activeChat && state.activeChat.id === channelId;

      return {
        activeChat: isActive
          ? { ...state.activeChat, ...payload.channel }
          : state.activeChat,
        data: [updatedChannel, ...otherChannels],
        main: "chat",
        ref: !state.ref,
      };
    }),

  setRefs: () =>
    set((state: ChatState) => ({ refs: !state.refs, ref: !state.ref })),

  setIsTyping: (payload: any) => {
    const state = get();
    // DRY helper
    set(
      updateDataAndActiveChat(state, payload.id, (ch) => ({
        ...ch,
        status: payload.desc,
        activeDate: payload?.date || ch.activeDate,
      })),
    );
  },

  watchChannelEvent: (payload: number) => {
    if (!payload) return;
    const state = get();
    const userId = getUserChat()?.id;
    const id = parseInt(payload.toString());

    // Use Helper Logic for status updates
    const updateResult = updateDataAndActiveChat(state, id, (ch) => ({
      ...ch,
      messages: processMessageStatuses(ch.messages, "watch", false),
    }));

    set({
      ...updateResult,
      newChats: state.newChats.filter((a: any) => parseInt(a.id) !== id),
    });
  },

  watchChannel: (payload: number | string) => {
    const state = get();
    const id =
      typeof payload === "string"
        ? parseInt(payload) || payload
        : parseInt(payload.toString()); // Handle "ch" strings better

    if (
      (typeof payload === "string" && !payload.includes("ch")) ||
      typeof payload === "number"
    ) {
      watchChannelAction(payload);
    }

    // Check existance
    const exists = state.data.some((s: any) => areIdsEqual(s.id, id));
    // If it's a string ID with 'ch', force update intent
    const forceUpdate = typeof payload === "string" && payload.includes("ch");

    if (exists || forceUpdate) {
      const userId = getUserChat()?.id;
      const updateResult = updateDataAndActiveChat(state, id, (ch) => ({
        ...ch,
        messages: processMessageStatuses(ch.messages, "watch", true),
      }));

      set({
        ...updateResult,
        newChats: state.newChats.filter((a: any) => !areIdsEqual(a.id, id)),
      });
    } else {
      // Just remove from newChats if not in data
      set({
        newChats: state.newChats.filter((a: any) => !areIdsEqual(a.id, id)),
      });
    }
  },

  receiveChannelEvent: (payload: number | string) => {
    if (!payload) return;
    const state = get();

    if (
      (typeof payload === "string" && !payload.includes("ch")) ||
      typeof payload === "number"
    ) {
      Recive(payload);
    }

    set(
      updateDataAndActiveChat(state, payload, (ch) => ({
        ...ch,
        messages: processMessageStatuses(ch.messages, "receive", false),
      })),
    );
  },

  openChat: (payload: any) => {
    const state = get();
    // Logic: if payload is an ID (and not a "ch" string), find it in data. Else treat payload as object.
    if (
      payload &&
      payload.id &&
      !(typeof payload.id === "string" && payload.id?.includes("ch"))
    ) {
      const found = state.data.find((a: any) => a.id === payload.id);
      set({
        activeChat: found || payload,
        newChats: state.newChats.filter((a: any) => a.id !== payload.id),
        openChatRenderer: Math.random(),
      });
    } else {
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
    const ac = payload.act;
    const isChannelId = payload.act?.id?.toString().includes("ch");

    // Scenario 1: New Chat or Special ID
    if (payload.isNew || isChannelId) {
      if (!payload.isPrivate) {
        // Create new object for the active chat with the new message
        const updatedChannel = {
          ...payload.act,
          messages: [...ac.messages, payload.message],
        };
        // Prepend to data
        const newData = [updatedChannel, ...state.data];

        const newActive =
          state.activeChat && state.activeChat.id === ac.id
            ? updatedChannel
            : state.activeChat;

        set({
          data: newData,
          activeChat: newActive,
          ref: !state.ref,
          refs: !state.refs,
          replyMessage: null,
        });
      } else {
        // Private logic
        let newActive = state.activeChat;
        if (state.activeChat?.id && areIdsEqual(state.activeChat.id, ac.id)) {
          newActive = {
            ...state.activeChat,
            messages: [...ac.messages, payload.message],
          };
        }
        set({
          data: state.data,
          activeChat: newActive,
          ref: !state.ref,
          refs: !state.refs,
          replyMessage: null,
        });
      }
      return;
    }

    // Scenario 2: Existing Chat
    if (payload.isPrivate) {
      if (!state.activeChat || !areIdsEqual(state.activeChat.id, ac.id)) return;
      const PrivateChannel = {
        ...state.activeChat,
        messages: [...state.activeChat.messages, payload.message],
      };
      set({
        activeChat: PrivateChannel,
        ref: !state.ref,
        refs: !state.refs,
        replyMessage: null,
      });
      return;
    }

    // Standard existing chat update
    const updateResult = updateDataAndActiveChat(state, ac.id, (ch) => {
      // Prevent duplicates
      if (
        !ch.messages.some(
          (m: any) => m.id && areIdsEqual(m.id, payload.message?.id),
        )
      ) {
        return { ...ch, messages: [...ch.messages, payload.message] };
      }
      return ch;
    });

    // Sort logic to move updated chat to top
    const updatedChat = updateResult.data?.find((d: any) =>
      areIdsEqual(d.id, ac.id),
    );
    const otherChats =
      updateResult.data?.filter((d: any) => !areIdsEqual(d.id, ac.id)) || [];
    const reorderedData = updatedChat
      ? [updatedChat, ...otherChats]
      : state.data;

    set({
      data: reorderedData,
      activeChat: updateResult.activeChat,
      ref: !state.ref,
      refs: !state.refs,
      replyMessage: null,
    });
  },

  sendRealMessage: (payload: any) => {
    const state = get();
    const cid = payload.cid;
    const currentUserId = getUserChat()?.id;

    // Helper to process message updates within a channel
    const updateMessages = (messages: any[]) => {
      const mapped = messages.map((m) => {
        if (m.mid === payload.mid && m.id !== payload.id) {
          return { ...payload, message_status: m.message_status, mid: null };
        }
        return m;
      });
      // Append if receive and not sender and not duplicate
      if (payload.recive && payload.sender_user_id !== currentUserId) {
        if (!mapped.some((s: any) => s.id === payload.id)) {
          return [...mapped, { ...payload, mid: null }];
        }
      }
      return mapped;
    };

    if (payload.isPrivate) {
      const updatedActive = {
        ...state.activeChat,
        id: payload.channel_id,
        messages: updateMessages(state.activeChat?.messages || []),
      };
      set({ activeChat: updatedActive });
      return;
    }

    // Update List
    const updateResult = updateDataAndActiveChat(state, cid, (ch) => ({
      ...ch,
      id: payload.channel_id || ch.id, // Update ID if provided
      messages: updateMessages(ch.messages),
    }));

    // Handle reordering (move to top)
    const updatedChat = updateResult.data?.find(
      (d: any) => d.id === (payload.channel_id || cid),
    );
    const others = updateResult.data?.filter(
      (d: any) => d.id !== (payload.channel_id || cid),
    );
    const newData = updatedChat ? [updatedChat, ...others] : state.data;

    // Handle New Chats Logic
    let newChats = [...state.newChats];
    const isDifferentChat =
      payload.recive && state.activeChat && payload.cid !== state.activeChat.id;
    const noActiveChat = !state.activeChat && payload.recive;

    if (
      (isDifferentChat || noActiveChat) &&
      !newChats.some((a: any) => a.id === payload.cid)
    ) {
      const chatToAdd = state.data.find((f: any) => f.id === payload.cid);
      if (chatToAdd) newChats.push(chatToAdd);
    }

    set({
      data: newData,
      activeChat: updateResult.activeChat,
      newChats,
      ref: !state.ref,
      refs: !state.refs,
    });
  },

  setMain: (payload: string) => set({ main: payload }),
  setNameModal: (payload: boolean) => set({ nameModal: payload }),
  setFirebaseToken: (payload: string) => set({ fbToken: payload }),

  setChats: (payload: Channel[], param: any[], replace = false) => {
    const state = get();
    const currentUserId = getUserChat()?.id;

    const processedPayload = payload.map((a) => ({
      ...a,
      messages: a.messages.reverse(),
    }));
    const processedParam = param.map((p) => ({
      ...p,
      messages: p.messages.reverse(),
    }));

    // Generate chatUsers list
    const users = payload
      .map(
        (a) =>
          a.channel_members.find((df: any) => df.user_id !== currentUserId)
            ?.user_id,
      )
      .filter(Boolean);

    // Sync active chat if it exists in payload
    const activeChatFound = state.activeChat?.id
      ? processedPayload.find((a) => a.id === state.activeChat.id)
      : null;

    // Identify New Chats (Optimization: Set vs Loop)
    const currentIds = new Set(state.data.map((c: any) => c.id));
    const newChatsToAdd = payload.filter((adsd) => {
      if (!currentIds.has(adsd.id)) {
        // Check for unwatched messages
        return adsd.messages.some((mes) =>
          mes.message_status.some(
            (st: any) =>
              st.user_id === currentUserId && st.is_watched === false,
          ),
        );
      }
      return false;
    });

    // Merge Data (Map for O(1) deduplication)
    const mergedMap = new Map();
    state.data.forEach((item: any) => mergedMap.set(item.id, item));
    processedPayload.forEach((item: any) => mergedMap.set(item.id, item));

    // Params go first
    const finalData = [...processedParam, ...Array.from(mergedMap.values())];

    set({
      data: finalData,
      activeChat: activeChatFound
        ? { ...activeChatFound }
        : activeChatFound === null
          ? null
          : state.activeChat,
      newChats: newChatsToAdd,
      chatUsers: users,
      chat_loading: true, // Note: kept true as per original, though function name implies data set
    });
  },

  setChatLoading: () => set({ chat_loading: true }),
  setChatDone: () => set({ chat_loading: false }),
  setQouted: (payload: any) => set({ qouted: payload }),

  setPageData: (payload: any) => {
    const state = get();
    // Helper to merge messages unique by ID
    const mergeMessages = (oldMsgs: any[], newMsgs: any[]) => {
      const existingIds = new Set(oldMsgs.map((m) => String(m.id)));
      const toAdd = newMsgs.filter((m) => !existingIds.has(String(m.id)));
      // Prepend new messages (pagination logic usually goes upwards)
      return [...toAdd, ...oldMsgs];
    };

    // Case: Channel not in data list
    if (!state.data.find((s: any) => String(s.id) === String(payload.ch))) {
      if (state.activeChat) {
        const merged = mergeMessages(state.activeChat.messages, payload.mes);
        set({
          activeChat: { ...state.activeChat, messages: merged },
          fetch: true,
          searchChat: { ...state.searchChat, loading: false },
          first: false,
          mid: payload.mes.length === 0 ? null : state.mid,
        });
      }
      return;
    }

    // Case: Channel in data list
    const updateResult = updateDataAndActiveChat(state, payload.ch, (ch) => ({
      ...ch,
      messages: mergeMessages(ch.messages, payload.mes),
    }));

    set({
      ...updateResult,
      fetch: true,
      searchChat: { ...state.searchChat, loading: false },
      first: false,
      mid: payload.mes.length === 0 ? null : state.mid,
    });
  },

  setMessagesPage: (payload: any) => set({ fetch: false, mid: payload }),

  muteChat: (payload: any) => {
    const state = get();
    const userId = getUserChat()?.id;
    set(
      updateDataAndActiveChat(state, payload.id, (chat) => ({
        ...chat,
        channel_members: chat.channel_members.map((mem: any) =>
          mem.user_id === userId
            ? { ...mem, mute: payload.value ? 1 : 0 }
            : mem,
        ),
      })),
    );
  },

  pinChat: (payload: any) => {
    const state = get();
    if (state.pinnedChats.length < 3) {
      const userId = getUserChat()?.id;
      // Move pinned chat to top? Original logic just replaced it in place in array,
      // but usually pinned chats float. Keeping original logic of just updating prop + shuffling array

      const otherChats = state.data.filter((s: any) => s.id !== payload.id);
      const targetChat = state.data.find((s: any) => s.id === payload.id);

      if (targetChat) {
        const updatedChat = {
          ...targetChat,
          channel_members: targetChat.channel_members.map((mem: any) =>
            mem.user_id === userId
              ? { ...mem, pin: payload.value ? 1 : 0 }
              : mem,
          ),
        };
        set({ data: [...otherChats, updatedChat] }); // Logic seems to push to end? Kept as is.
      }
    } else {
      const Toast = async () => {
        showErrorNotification(translate("only 3 pinned chats allowed"));
      };
      Toast();
    }
  },

  updateChannelBlockStatus: (payload: {
    channelId: number | string;
    userId: number | string;
    isBlocked: boolean;
  }) => {
    const state = get();
    const { channelId, userId, isBlocked } = payload;
    if (channelId === undefined || userId === undefined) return;

    const channelKey = channelId.toString();
    const userKey = userId.toString();

    const updateMembers = (chat: any) => {
      if (!chat || !chat.channel_members) return chat;
      return {
        ...chat,
        channel_members: chat.channel_members.map((member: any) =>
          member && member.user_id?.toString() === userKey
            ? { ...member, is_blocked: isBlocked ? 1 : 0 }
            : member,
        ),
      };
    };

    set({
      ...updateDataAndActiveChat(state, channelKey, updateMembers),
      newChats: state.newChats.map((chat: any) =>
        chat && chat.id?.toString() === channelKey ? updateMembers(chat) : chat,
      ),
    });
  },

  setUnreadChat: (payload: any) => {
    const state = get();
    set({
      data: state.data.map((chat: any) =>
        chat.id === payload.id ? { ...chat, unread: payload.value } : chat,
      ),
    });
  },

  editChatInfo: (payload: any) => {
    const state = get();
    set(
      updateDataAndActiveChat(state, payload.id, (s) => ({
        ...s,
        message_counts: payload.data,
      })),
    );
  },

  editChatInfoMedia: (payload: any) => {
    const state = get();
    set(
      updateDataAndActiveChat(state, payload.id, (s) => ({
        ...s,
        message_counts: {
          ...s.message_counts,
          ...getMediaReducer(payload.media, payload.data),
        },
      })),
    );
  },

  showNotificationIndicator: (e: any) => {
    set((state: ChatState) => ({ showNotificaionCircle: e }));
  },

  deleteChat: (payload: any) => {
    set((state: ChatState) => ({
      data: state.data.filter(
        (chat) => parseInt(chat.id) !== parseInt(payload.id),
      ),
      activeChat: null,
      main: "main",
    }));
  },

  deleteMessage: (payload: any) => {
    const state = get();

    const updateMessageLogic = (messages: any[]) => {
      return messages.map((msg) => {
        // Clear content if it matches parent_message ID
        if (parseInt(msg.parent_message?.id) === parseInt(payload.msg_id)) {
          msg = {
            ...msg,
            parent_message: {
              ...msg.parent_message,
              auth_message_status: {
                ...(msg?.parent_message?.auth_message_status || {}),
                is_deleted: 1,
              },
              message_content: { content: "" },
            },
          };
        }
        // Mark deleted if matches ID
        if (parseInt(msg.id) === parseInt(payload.msg_id)) {
          return {
            ...msg,
            auth_message_status: {
              ...(msg?.auth_message_status || {}),
              is_deleted: 1,
            },
          };
        }
        return msg;
      });
    };

    if (
      state.data.some(
        (chat: any) => parseInt(chat.id) === parseInt(payload.ch_id),
      )
    ) {
      set(
        updateDataAndActiveChat(state, payload.ch_id, (chat) => ({
          ...chat,
          messages: updateMessageLogic(chat.messages),
        })),
      );
    } else {
      // Fallback for active chat only
      if (state.activeChat) {
        set({
          activeChat: {
            ...state.activeChat,
            messages: updateMessageLogic(state.activeChat.messages),
          },
        });
      }
    }
  },

  deleteErrorMessage: (payload: any) => {
    const state = get();
    const filterFn = (msg: any) => String(msg.mid) !== String(payload.msg_id);

    if (
      state.data.some(
        (chat: any) => parseInt(chat.id) === parseInt(payload.ch_id),
      )
    ) {
      set(
        updateDataAndActiveChat(state, payload.ch_id, (chat) => ({
          ...chat,
          messages: chat.messages.filter(filterFn),
        })),
      );
    } else {
      if (
        state.activeChat &&
        parseInt(state.activeChat.id) === parseInt(payload.ch_id)
      ) {
        set({
          activeChat: {
            ...state.activeChat,
            messages: state.activeChat.messages.filter(filterFn),
          },
        });
      }
    }
  },

  deleteCall: (payload: number) =>
    set((state: ChatState) => ({
      calls: state.calls.filter(
        (call) => parseInt(call.id) !== parseInt(payload.toString()),
      ),
    })),

  setReplyMessage: (payload: any) => set({ replyMessage: payload }),
});
