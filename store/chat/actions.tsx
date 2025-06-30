import {
  DELETE_CHAT_URL,
  SEARCH_CONTACTS_URL,
  SEND_MESSAGE_URL,
  SET_CHANNEL_OPT_UTL,
} from "utils/endpointConfig";
import { getUserChat } from "utils/functions";
import { useAppStore } from "store";
import chat from "services/chat";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
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
    let response = await AxiosPost({
      url:
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + "/api/v1/channels/my_calls",
      body: { limit: "20", last_message_id: id },
      title: "Get Calls",
      token: JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
    });

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
    let response = await AxiosPost({
      url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + SEND_MESSAGE_URL,
      body: JSON.stringify(message),
      title: "Send Message",
      token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
      headers: {
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1",
      },
    });
    if (response?.id) {
      if (isNew) {
        sendNewMessage({
          channel: {
            id: response.channel_id,
            messages: [{ ...response }],
            mid: isNew,
          },
        });
      } else {
        sendRealMessage({
          ...response,
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
  } catch (e) {}
}

export async function DeleteMessageApi(msg_id, bool) {
  let response = await AxiosPost({
    url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + "/api/v1/messages/destroy",
    body: JSON.stringify({ id: msg_id, delete_for_all: bool ? 1 : 0 }),
    title: "Delete Message",
    token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
    headers: {
      current_role_id:
        localStorage.getItem("USER-CHAT") && getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
          : "-1",
    },
  });
}
export async function deleteChat(payload) {
  try {
    let response = await AxiosPost({
      url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + DELETE_CHAT_URL,
      body: JSON.stringify({ id: payload }),
      title: "Delete Channel",
      token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
      headers: {
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1",
      },
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
  } catch (e) {}
}
export async function getPage(channel, mid) {
  const { setPageData } = useAppStore.getState();

  try {
    let channel_id = channel;

    let response = await AxiosPost({
      url:
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v1/messages/messages_of_channel/${channel_id}?message_id=${mid}&limit=10`,
      body: {},
      title: "Get Messages Of Channel",
      token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
      headers: {
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1",
      },
    });

    setPageData({ mes: response, ch: channel_id });
  } catch (e) {}
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

      setChatSearchResults(response.data);
    }
  } catch (e) {}
}
export async function PinnChat(payload) {
  try {
    let response = await AxiosPost({
      url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + SET_CHANNEL_OPT_UTL,
      body: JSON.stringify({
        channel_id: payload.id,
        id: payload?.member_id,
        pin: payload.value ? 1 : 0,
      }),
      title: "Pin Channel",
      token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
      headers: {
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1",
      },
    });
  } catch (e) {}

  chat.getChats(true);
}
export async function MuteChat(payload) {
  try {
    let response = await AxiosPost({
      url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + SET_CHANNEL_OPT_UTL,
      body: JSON.stringify({
        channel_id: payload.id,
        id: payload?.member_id,
        mute: payload.value ? 1 : 0,
      }),
      title: "Mute Channel",
      token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
      headers: {
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1",
      },
    });
  } catch (e) {}
}
export async function getMessagesBetweenMessage(payload) {
  const { setPageData } = useAppStore.getState();

  let response = await AxiosPost({
    url:
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
      `/api/v1/messages/messages_of_channel/${payload.first}`,
    body: JSON.stringify({ limit: payload.second + 1 }),
    title: "Get Messages of Channel",
    token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
    headers: {
      current_role_id:
        localStorage.getItem("USER-CHAT") && getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
          : "-1",
    },
  });

  setPageData({ mes: response, ch: payload.first });
}

export async function getContacts() {
  const { setContacts } = useAppStore.getState();

  let response = await fetchData({
    url: "/api/v1/users/my_contacts",
    reqTitle: "Get Contacts",
    method: "GET",
    server: "chat",
  });

  setContacts(response.data);
}
export const getMedia = async (id, media) => {
  const { editChatInfoMedia } = useAppStore.getState();
  try {
    let response = await AxiosPost({
      url:
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v1/messages/messages_of_channel/${id}?limit=10&message_type=${media}`,
      body: {},
      title: "get Media for a Channel",
      token: localStorage.getItem("USER-CHAT") && getUserChat().access_token,
      headers: {
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1",
      },
    });

    editChatInfoMedia({ id: id, data: response.data.data, media: media });
  } catch (e) {}
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
      url:
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v2/channels/${id}/media`,
      reqTitle: "Get Channel Data",
      method: "GET",
      server: "chat",
    });

    editChatInfo({ id: id, data: response.data });
  } catch (e) {}
};
