import {
  DELETE_CHAT_URL,
  SEARCH_CONTACTS_URL,
  SEND_MESSAGE_URL,
  SET_CHANNEL_OPT_UTL,
} from "utils/endpointConfig";
import { useAppStore } from "store";
import chat from "services/chat";
import { fetchData } from "utils/fetchData";

export const GetLastSeen = async (chatId, friendID) => {
  const { setServerTime, setIsTyping } = useAppStore.getState();
  try {
    const { onValue, ref } = await import("firebase/database");
    const { db } = await import("../../utils/firebaseInitv1");
    let server_time;

    let response = await fetchData({
      url: "/api/v1/channels/get_date_time",
      reqTitle: "Get Last Seen",
      method: "GET",
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
  } catch (e) {
    console.error(e);
  }
};
export const setLastSeen = async (MyId) => {
  const { setServerTime } = useAppStore.getState();
  try {
    const { push, ref, set } = await import("firebase/database");
    let server_time;
    let response = await fetchData({
      url: "/api/v1/channels/get_date_time",
      reqTitle: "Get Last Seen",
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    server_time = response.data;
    setServerTime(response.data);
    const { db } = await import("../../utils/firebaseInitv1");
    push(ref(db, `ConnectStatus/${MyId.toString()}`));
    set(ref(db, `ConnectStatus/${MyId.toString()}`), server_time)
      .then(() => {
        // Success.
      })
      .catch((error) => {});
  } catch (e) {
    console.error(e);
  }
};
export const getCalls = async (id) => {
  const { setCallLoading, setCalls } = useAppStore.getState();
  try {
    setCallLoading(true);
    let response = await fetchData({
      url: "/api/v1/channels/my_calls",
      reqTitle: "Get Calls",
      method: "POST",
      server: "chat",
      body: JSON.stringify({ limit: "20", last_message_id: id }),
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    setCalls(response);
    setCallLoading(false);
  } catch (e) {
    setCallLoading(false);
    console.error(e);
  }
};
export const SendMessage = async (payload, isNew, isPrivate?) => {
  const { sendNewMessage, sendRealMessage } = useAppStore.getState();
  let message = payload;
  try {
    let response = await fetchData({
      url: SEND_MESSAGE_URL,
      body: JSON.stringify(message),
      reqTitle: "Send Message",
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
  } catch (e) {
    console.error(e);
  }
};
export async function watchChannel(payload) {
  try {
    let response = await fetchData({
      url: `/api/v1/channels/${payload}/watched`,
      reqTitle: "Watch Channel",
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (e) {
    console.error(e)
  }
}

export async function DeleteMessageApi(msg_id, bool) {
  await fetchData({
    url: "/api/v1/messages/destroy",
    body: JSON.stringify({ id: msg_id, delete_for_all: bool ? 1 : 0 }),
    reqTitle: "Delete Message",
    method: "POST",
    server: "chat",
  });
}
export async function deleteChat(payload) {
  try {
    await fetchData({
      url: DELETE_CHAT_URL,
      body: JSON.stringify({ id: payload }),
      reqTitle: "Delete Channel",
      method: "POST",
      server: "chat",
    });
  } catch (e) {
    console.error(e);
  }
}
export async function Recive(payload) {
  try {
    let response = await fetchData({
      url: `/api/v1/channels/${payload}/received`,
      reqTitle: "Recieve Channel",
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (e) {
    console.error(e);
  }
}
export async function getPage(channel, mid) {
  const { setPageData } = useAppStore.getState();
  try {
    let channel_id = channel;

    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${channel_id}?message_id=${mid}&limit=10`,
      reqTitle: "Get Messages Of Channel",
      method: "POST",
      server: "chat",
      body: {},
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    setPageData({ mes: response.data, ch: channel_id });
  } catch (e) {
    console.error(e);
  }
}
export async function SearchContact(payload) {
  const { setChatSearchResults } = useAppStore.getState();

  try {
    if (payload?.length > 0) {
      let response = await fetchData({
        url: SEARCH_CONTACTS_URL + payload,
        reqTitle: "Search Message",
        method: "GET",
        server: "chat",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setChatSearchResults(response.data);
    }
  } catch (e) {
    console.error(e);
  }
}
export async function PinnChat(payload) {
  try {
    const response =  await fetchData({
      url: SET_CHANNEL_OPT_UTL,
      body: JSON.stringify({
        channel_id: payload.id,
        id: payload?.member_id,
        pin: payload.value ? 1 : 0,
      }),
      reqTitle: "Pin Channel",
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
      reqTitle: "Mute Channel",
      method: "POST",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (e) {
    console.error(e);
  }
}
export async function getMessagesBetweenMessage(payload) {
  const { setPageData } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${payload.first}`,
      reqTitle: "Get Messages of Channel",
      method: "POST",
      server: "chat",
      body: JSON.stringify({ limit: payload.second + 1 }),
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setPageData({ mes: response.data, ch: payload.first });
  } catch (error) {
    console.error(error);
  }
}

export async function getContacts() {
  const { setContacts } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: "/api/v1/users/my_contacts",
      reqTitle: "Get Contacts",
      method: "GET",
      server: "chat",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setContacts(response.data);
  } catch (error) {
    console.error(error);
  }
}
export const getMedia = async (id, media) => {
  const { editChatInfoMedia } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${id}?limit=10&message_type=${media}`,
      reqTitle: "get Media for a Channel",
      method: "POST",
      server: "chat",
      body: {},
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    editChatInfoMedia({ id: id, data: response.data, media: media });
  } catch (e) {
    console.error(e);
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
      url: `/api/v2/channels/${id}/media`,
      reqTitle: "Get Channel Data",
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    editChatInfo({ id: id, data: response.data });
  } catch (e) {
    console.error(e);
  }
};
