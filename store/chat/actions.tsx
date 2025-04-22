import {
  DELETE_CHAT_URL,
  GET_CHATS_URL,
  GET_CONTATCS_URL,
  SEARCH_CONTACTS_URL,
  SEARCH_USERS_URL,
  SEND_MESSAGE_URL,
  SET_CHANNEL_OPT_UTL,
} from "utils/endpointConfig";
import { getUserChat } from "utils/functions";

import { AxiosGet } from "utils/AxiosApi";
import { GetChatsApi, GetContactsApi } from "models/Api";
import { useAppStore } from "store";

export const ChatConroller = (payload) => {
  const { openChat } = useAppStore.getState();
  if (payload) document.documentElement.style.overflow = "hidden";
  else document.documentElement.style.overflow = "initial";
  window.history.pushState({ isPopup: true }, "open Chat");
  openChat(payload);
};
export const GetChats = async (payload) => {
  const {
    setChatLoading,
    setChatDone,
    setChats,
    setIsTyping,
    setLastNotificationDate,
    setContacts,
  } = useAppStore.getState();

  const { onValue, ref } = await import("firebase/database");
  try {
    let axios = (await import("axios")).default;
    if (!payload) {
      setChatLoading();
    }
    let resp: GetChatsApi = await axios.post(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + GET_CHATS_URL,
      { role_id: 116 },
      {
        headers: {
          Authorization:
            `Bearer ` +
            JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
        },
      }
    );
    setChats(resp.data.data.channels, resp.data.data.pinned_channels);
    const { db } = await import("../../utils/firebaseInitv1");
    let chats = [...resp.data.data.channels, ...resp.data.data.pinned_channels];
    chats.map((chat) => {
      let friendID = chat.channel_members.filter(
        (member) => parseInt(member.user_id) !== parseInt(getUserChat().id)
      )[0]?.user_id;
      let MyId = getUserChat().id;
      //wew

      const dbRef = ref(db, `Transaction/${friendID}/${MyId}`);
      onValue(dbRef, (snapshot) => {
        const desc = snapshot.val();

        if (!!desc) {
          if (typeof desc === "string") {
            setIsTyping({ id: chat.id, desc: desc });
          } else {
            setIsTyping({
              id: chat.id,
              desc:
                Object.keys(desc).length > 0
                  ? desc[Object.keys(desc)[0]]
                  : null,
            });
          }
        } else {
          setIsTyping({ id: chat.id, desc: null });
        }
      });
    });

    setLastNotificationDate(new Date().toLocaleString());
    setChatDone();
    if (payload !== "share") {
      getCalls(null);
      let response: GetContactsApi = await axios.get(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + GET_CONTATCS_URL,
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
          },
        }
      );
      setContacts(response.data.data);
    }
  } catch (e) {
    console.error(e);
  }
};
export const GetLastSeen = async (chatId, friendID) => {
  const { setServerTime, setIsTyping } = useAppStore.getState();
  try {
    const { onValue, ref } = await import("firebase/database");
    const { db } = await import("../../utils/firebaseInitv1");
    let server_time;
    let axios = (await import("axios")).default;
    await axios
      .get(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          "/api/v1/channels/get_date_time",
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
          },
        }
      )
      .then((data) => {
        server_time = data.data.data;
        setServerTime(data.data.data);
      });
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
    let axios = (await import("axios")).default;
    await axios
      .get(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          "/api/v1/channels/get_date_time",
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
          },
        }
      )
      .then((data) => {
        server_time = data.data.data;
        setServerTime(data.data.data);
      });
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
    let axios = (await import("axios")).default;
    setCallLoading(true);
    await axios
      .post(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + "/api/v1/channels/my_calls",
        { limit: "20", last_message_id: id },
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
          },
        }
      )
      .then((data) => {
        setCalls(data.data.data);
      });
  } catch (e) {
    console.error(e);
  }
};
export const SendMessage = async (payload, isNew) => {
  const { sendNewMessage, sendRealMessage } = useAppStore.getState();
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") && getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
  let message = payload;
  try {
    let a = await AxiosInstance.post(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + SEND_MESSAGE_URL,
      JSON.stringify(message)
    );
    if (a.data.data) {
      if (isNew) {
        sendNewMessage({
          channel: {
            id: a.data.data.channel_id,
            messages: [{ ...a.data.data }],
            mid: isNew,
          },
        });
      } else {
        sendRealMessage({
          ...a.data.data,
          mid: payload.mid,
          cid: payload.cid,
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
};
export async function watchChannel(payload) {
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    // await AxiosInstance.get(`/api/v1/channels/${payload}/received`);
    let resp = await AxiosInstance.get(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v1/channels/${payload}/watched`
    );
  } catch (e) {}
}

export async function DeleteMessageApi(msg_id, bool) {
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") && getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
  await AxiosInstance.post(
    "/api/v1/messages/destroy",
    JSON.stringify({ id: msg_id, delete_for_all: bool ? 1 : 0 })
  );
}
export async function deleteChat(payload) {
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    await AxiosInstance.post(DELETE_CHAT_URL, JSON.stringify({ id: payload }));
  } catch (e) {
    console.error(e);
  }
}
export async function Recive(payload) {
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") && getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
  try {
    await AxiosInstance.get(`/api/v1/channels/${payload}/received`);
  } catch (e) {}
}
export async function getPage(channel, mid) {
  const { setPageData } = useAppStore.getState();
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    let channel_id = channel;
    let res = await AxiosInstance.post(
      `api/v1/messages/messages_of_channel/${channel_id}?message_id=${mid}&limit=10`
    );
    setPageData({ mes: res.data.data, ch: channel_id });
  } catch (e) {}
}
export async function SearchContact(payload) {
  const { setChatSearchResults } = useAppStore.getState();
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    if (payload?.length > 0) {
      let res = await AxiosInstance.get(SEARCH_CONTACTS_URL + payload);
      setChatSearchResults(res.data.data);
    }
  } catch (e) {}
}
export async function PinnChat(payload) {
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    await AxiosInstance.post(
      SET_CHANNEL_OPT_UTL,
      JSON.stringify({
        channel_id: payload.id,
        id: getUserChat().id,
        pin: payload.value ? 1 : 0,
      })
    );
    GetChats(true);
  } catch (e) {}
}
export async function MuteChat(payload) {
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") && getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    await AxiosInstance.post(
      SET_CHANNEL_OPT_UTL,
      JSON.stringify({
        channel_id: payload.id,
        id: getUserChat().id,
        mute: payload.value ? 1 : 0,
      })
    );
  } catch (e) {}
}
export async function getMessagesBetweenMessage(payload) {
  const { setPageData } = useAppStore.getState();
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") && getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
  let res = await AxiosInstance.post(
    `/api/v1/messages/messages_of_channel/${payload.first}`,
    JSON.stringify({ limit: payload.second + 1 })
  );
  setPageData({ mes: res.data.data, ch: payload.first });
}

export async function getContacts() {
  const { setContacts } = useAppStore.getState();
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") && getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") && getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") && getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
  let res = await AxiosInstance.get("/api/v1/users/my_contacts");
  setContacts(res.data.data);
}
export const getMedia = async (id, media) => {
  const { editChatInfoMedia } = useAppStore.getState();
  try {
    let axios = (await import("axios")).default;
    let resp = await axios.post(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v1/messages/messages_of_channel/${id}?limit=10&message_type=${media}`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ` +
            JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
        },
      }
    );
    editChatInfoMedia({ id: id, data: resp.data.data, media: media });
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
    let axios = (await import("axios")).default;
    let resp = await axios.get(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + `/api/v2/channels/${id}/media`,
      {
        headers: {
          Authorization:
            `Bearer ` +
            JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
        },
      }
    );
    editChatInfo({ id: id, data: resp.data.data });
  } catch (e) {}
};
export const getCurrency = async ({ lang, country, callback }) => {
  let currency = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/mobile/home/currency",
    title: "Currency Request",
  });
  //
  callback({ currency: currency?.currency, res: {} });
  return currency?.currency;
};
