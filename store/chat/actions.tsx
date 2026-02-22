import {
  DELETE_CHAT_URL,
  SEARCH_CONTACTS_URL,
  SEND_MESSAGE_URL,
  SET_CHANNEL_OPT_UTL,
} from "utils/endpointConfig";
import { useAppStore } from "store";
import chat from "services/chat";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";

import UPDATED_API_DATA from "migration.staging";

export const GetLastSeen = async (chatId, friendID) => {
  const { setServerTime, setIsTyping } = useAppStore.getState();
  try {
    const { onValue, ref } = await import("firebase/database");
    const { getDb } = await import("../../utils/firebaseInitv1");
    const db = await getDb();
    let server_time;

    let response = await fetchData({
      url: "/api/v1/channels/get_date_time",
      reqTitle: REQUESTS_DATA.GET_LAST_SEEN,
      method: UPDATED_API_DATA.MOD_DATE_TIME_METHOD as any,

      // ###EDIT###
      // method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    server_time = response.data;
    setServerTime(response.data);
    const dbRef = ref(db, `ConnectStatus/${friendID.toString()}`);
    onValue(dbRef, async (snapshot) => {
      const desc = snapshot.val();

      if (!!desc) {
        if (typeof desc === "string") {
          let date = desc;
          setIsTyping({ id: chatId.toString(), date: date });
        } else {
          const { showDate } = await import("components/Chat/chatsFunctions");
          let date =
            Object.keys(desc).length > 0 &&
            showDate(desc[Object.keys(desc)[0]]);
          setIsTyping({
            id: chatId.toString(),
            desc: Object.keys(desc).length > 0 ? date : null,
          });
        }
      } else {
        setIsTyping({ id: chatId.toString(), desc: null, date: null });
      }
    });
  } catch (error) {
    LogError({
      scenario: "Error in GetLastSeen in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const setLastSeen = async (MyId) => {
  const { setServerTime } = useAppStore.getState();
  try {
    const { push, ref, set } = await import("firebase/database");
    let server_time;
    let response = await fetchData({
      url: "/api/v1/channels/get_date_time",
      reqTitle: REQUESTS_DATA.GET_LAST_SEEN,
      method: UPDATED_API_DATA.MOD_DATE_TIME_METHOD as any,
      // ###EDIT###
      // method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    server_time = response.data;
    setServerTime(response.data);
    const { getDb } = await import("../../utils/firebaseInitv1");
    const db = await getDb();
    push(ref(db, `ConnectStatus/${MyId.toString()}`));
    set(ref(db, `ConnectStatus/${MyId.toString()}`), server_time)
      .then(() => {
        // Success.
      })
      .catch((error) => {
        LogError(error);
      });
  } catch (error) {
    LogError({
      scenario: "Error in setLastSeen in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const getCalls = async (id) => {
  const { setCallLoading, setCalls } = useAppStore.getState();
  try {
    setCallLoading(true);
    let response = await fetchData({
      url: "/api/v1/channels/my_calls",
      reqTitle: REQUESTS_DATA.GET_CALLS,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ limit: "20", last_message_id: id }),
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    setCalls(response.data);
    setCallLoading(false);
  } catch (error) {
    setCallLoading(false);
    LogError({
      scenario: "Error in getCalls in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const SendMessage = async (payload, isNew, isPrivate?) => {
  const { sendNewMessage, sendRealMessage, deleteErrorMessage } =
    useAppStore.getState();
  let message = isPrivate
    ? {
        ...payload,
        order_chat_participant_id: isPrivate,
      }
    : payload;

  try {
    let response = await fetchData({
      url: SEND_MESSAGE_URL,
      body: JSON.stringify(message),
      reqTitle: REQUESTS_DATA.SEND_MESSAGE,
      method: "POST",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    if (response?.data?.id) {
      if (isNew) {
        sendNewMessage({
          channel: {
            id: response.data.channel_id,
            messages: [{ ...response.data }],
            mid: isNew,
          },
        });
      } else {
        sendRealMessage({
          ...response.data,
          mid: payload.mid,
          cid: payload.cid,
          isPrivate: isPrivate,
        });
      }
    }
  } catch (error) {
    deleteErrorMessage({ msg_id: payload.mid, ch_id: payload.cid });
    LogError({
      scenario: "Error in SendMessage in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export async function watchChannel(payload) {
  try {
    let response = await fetchData({
      url: `/api/v1/channels/${payload}/watched`,
      reqTitle: REQUESTS_DATA.WATCH_CHANNEL,
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (error) {
    LogError({
      scenario: "Error in watchChannel in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function DeleteMessageApi(msg_id, bool) {
  await fetchData({
    url: "/api/v1/messages/destroy",
    body: JSON.stringify({ id: msg_id, delete_for_all: bool ? 1 : 0 }),
    reqTitle: REQUESTS_DATA.DELETE_MESSAGE,
    method: "POST",
    server: "chat",
  });
}
export async function deleteChat(payload) {
  try {
    await fetchData({
      url: DELETE_CHAT_URL,
      body: JSON.stringify({ id: payload }),
      reqTitle: REQUESTS_DATA.DELETE_CHANNEL,
      method: "POST",
      server: "chat",
    });
  } catch (error) {
    LogError({
      scenario: "Error in deleteChat in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function Recive(payload) {
  try {
    let response = await fetchData({
      url: `/api/v1/channels/${payload}/received`,
      reqTitle: REQUESTS_DATA.RECIEIVE_CHANNEL,
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (error) {
    LogError({
      scenario: "Error in Recive in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function getPage(channel, mid) {
  const { setPageData } = useAppStore.getState();
  try {
    let channel_id = channel;

    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${channel_id}?message_id=${mid}&limit=10`,
      reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
      method: "POST",
      server: "chat",

      // ###EDIT###
      // body: {},
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    setPageData({ mes: response.data, ch: channel_id });
  } catch (error) {
    LogError({
      scenario: "Error in getMessagesBetweenMessage in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function SearchContact(payload) {
  const { setChatSearchResults } = useAppStore.getState();

  try {
    if (payload?.length > 0) {
      let response = await fetchData({
        url: SEARCH_CONTACTS_URL + payload,
        reqTitle: REQUESTS_DATA.SEARCH_MESSAGE,
        method: "GET",
        server: "chat",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setChatSearchResults(response.data);
    }
  } catch (error) {
    LogError({
      scenario: "Error in SearchContact in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function PinnChat(payload) {
  try {
    const response = await fetchData({
      url: SET_CHANNEL_OPT_UTL,
      body: JSON.stringify({
        channel_id: payload.id,
        id: payload?.member_id,
        pin: payload.value ? 1 : 0,
      }),
      reqTitle: REQUESTS_DATA.PIN_CHANNEL,
      method: "POST",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (e) {
    console.error(e);
  }

  chat.getChats(true);
}
export async function MuteChat(payload) {
  try {
    const response = await fetchData({
      url: SET_CHANNEL_OPT_UTL,
      body: JSON.stringify({
        channel_id: payload.id,
        id: payload?.member_id,
        mute: payload.value ? 1 : 0,
      }),
      reqTitle: REQUESTS_DATA.MUTE_CHANNEL,
      method: "POST",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (error) {
    LogError({
      scenario: "Error in MuteChat in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function getMessagesBetweenMessage(payload) {
  const { setPageData } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${payload.first}`,
      reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ limit: payload.second + 10 }),
      // ###EDIT###
      // body: JSON.stringify({ limit: payload.second + 1 }),
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setPageData({ mes: response.data, ch: payload.first });
  } catch (error) {
    LogError({
      scenario: "Error in getMessagesBetweenMessage in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export const getMessagesBetweenTwoMessages = async ({
  first,
  second,
  channel_id,
}) => {
  const { setPageData } = useAppStore.getState();
  let response = await fetchData({
    url: `/api/v1/messages/get_all_messages_between_two_messages`,
    reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
    method: "POST",
    server: "chat",
    body: JSON.stringify({
      channel_id: channel_id,
      first_message_id: first,
      second_message_id: second,
    }),
  });

  if (!response.success) {
    throw new Error(response.message);
  }
  setPageData({ mes: response.data, ch: channel_id });
};
export async function GetMessageforRepliedMessages(payload) {
  const { setPageData } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${payload.first}`,
      reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ limit: payload.second + 1 }),
      // ###EDIT###
      // body: JSON.stringify({ limit: payload.second + 1 }),
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setPageData({ mes: response.data, ch: payload.first });
  } catch (error) {
    LogError({
      scenario: "Error in GetMessageforRepliedMessages in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getContacts() {
  const { setContacts } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: "/api/v1/users/my_contacts",
      reqTitle: REQUESTS_DATA.GET_CONTACTS,
      method: UPDATED_API_DATA.MOD_CONTACTS_METHOD as any,
      // ###EDIT###
      // method: "GET",
      server: "chat",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setContacts(response.data);
  } catch (error) {
    LogError({
      scenario: "Error in getContacts in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export const getMedia = async (id, media) => {
  const { editChatInfoMedia } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${id}?limit=10&message_type=${media}`,
      reqTitle: REQUESTS_DATA.GET_MEDIA_FOR_A_CHANNEL,
      body: JSON.stringify({
        limit: 10,
        message_type: media,
      }),
      method: "POST",
      server: "chat",

      // ###EDIT###
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    editChatInfoMedia({ id: id, data: response.data, media: media });
  } catch (e) {
    LogError({
      scenario: "Error in getMedia in  chat/actions",
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
export const getMediaReducer = (media, data) => {
  if (media === "ImageMessage") {
    return { image_messages: data };
  }
  if (media === "VideoMessage") {
    return { video_messages: data };
  }
  if (media === "FileMessage") {
    return { file_messages: data };
  }
};

export const GetChatDetails = async (id) => {
  const { editChatInfo } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: UPDATED_API_DATA.MOD_MEDIA_CHAT_URL.replace("__", `${id}`),
      reqTitle: REQUESTS_DATA.GET_CHANNEL_DATA,
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    editChatInfo({ id: id, data: response.data });
  } catch (e) {
    LogError({
      scenario: "Error in GetChatDetails in  chat/actions",
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
