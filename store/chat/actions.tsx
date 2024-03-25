import {
  CHAT_URL,
  DELETE_CHAT_URL,
  GET_CHATS_URL,
  GET_CONTATCS_URL,
  SEARCH_CONTACTS_URL,
  SEARCH_USERS_URL,
  SEND_MESSAGE_URL,
  SET_CHANNEL_OPT_UTL,
} from "utils/endpointConfig";
import { store } from "../index";
import { getUserChat, translate } from "utils/functions";
export const ChatConroller = (payload) => {
  return { type: "CHAT-OPEN", payload: payload };
};
export const GetChats = async (payload) => {
  const { onValue, ref } = await import("firebase/database");
  try {
    let axios = (await import("axios")).default;
    if (!payload) {
      store.dispatch({ type: "CHAT_LOADING" });
    }
    let resp = await axios.post(
      CHAT_URL + GET_CHATS_URL,
      { role_id: 116 },
      {
        headers: {
          Authorization:
            `Bearer ` +
            JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
        },
      }
    );
    if (!payload) {
    }
    store.dispatch({
      type: "GET_CHAT_RED",
      payload: resp.data.data.channels,
      param: resp.data.data.pinned_channels,
    });
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
            store.dispatch({
              type: "IS_TYPING_TRUE",
              payload: { id: chat.id, desc: desc },
            });
          } else {
            store.dispatch({
              type: "IS_TYPING_TRUE",
              payload: {
                id: chat.id,
                desc:
                  Object.keys(desc).length > 0
                    ? desc[Object.keys(desc)[0]]
                    : null,
              },
            });
          }
          console.log(desc);
        } else {
          store.dispatch({
            type: "IS_TYPING_TRUE",
            payload: { id: chat.id, desc: null },
          });
        }
      });
    });
    store.dispatch({
      type: "SET_LAST_NOTIFICATION_DATE",
      payload: new Date().toLocaleString(),
    });
    store.dispatch({ type: "CHAT_DONE" });
    getCalls(null);
    let response = await axios.get(CHAT_URL + GET_CONTATCS_URL, {
      headers: {
        Authorization:
          `Bearer ` +
          JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
      },
    });
    store.dispatch({ type: "GET_CONTACTS_RED", payload: response.data.data });
  } catch (e) {
    console.error(e);
  }
};
export const getCalls = async (id: any) => {
  try {
    let axios = (await import("axios")).default;
    store.dispatch({ type: "CALL_LOADING", payload: true });
    await axios
      .post(
        CHAT_URL + "/api/v1/channels/my_calls",
        { limit: "20", last_message_id: id },
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
          },
        }
      )
      .then((data) => {
        store.dispatch({
          type: "GET_CALLS",
          payload: data.data.data,
          param: id,
        });
      });
  } catch (e) {
    console.error(e);
  }
};
export const SendMessage = async (payload, isNew) => {
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: CHAT_URL,
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
      CHAT_URL + SEND_MESSAGE_URL,
      JSON.stringify(message)
    );
    if (a.data.data) {
      if (isNew) {
        store.dispatch({
          type: "SEND_MES_RED_NEW",
          payload: {
            channel: {
              id: a.data.data.channel_id,
              messages: [{ ...a.data.data }],
              mid: isNew,
            },
          },
        });
      } else {
        store.dispatch({
          type: "SEND_MES_RED",
          payload: {
            ...a.data.data,
            mid: payload.mid,
            cid: payload.cid,
          },
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
      baseURL: CHAT_URL,
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
      CHAT_URL + `/api/v1/channels/${payload}/watched`
    );
  } catch (e) {}
}
export async function StartChat(payload) {
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: CHAT_URL,
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
    store.dispatch({ type: "CHAT_LOADING_USER" });
    const base = CHAT_URL;
    let resp = await AxiosInstance.get(base + SEARCH_USERS_URL + payload);
    store.dispatch({ type: "SEARCH_USER_RED", payload: resp.data.data });
    store.dispatch({ type: "CHAT_DONE_USER" });
  } catch (e) {
    store.dispatch({ type: "SEARCH_USER_RED", payload: [] });
  }
}
export async function DeleteMessageApi(msg_id, bool) {
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: CHAT_URL,
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
      baseURL: CHAT_URL,
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
    baseURL: CHAT_URL,
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
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: CHAT_URL,
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
    store.dispatch({
      type: "GRP",
      payload: { mes: res.data.data, ch: channel_id },
    });
  } catch (e) {}
}
export async function SearchContact(payload) {
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: CHAT_URL,
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
      store.dispatch({ type: "SEARCH_REDUCER", payload: res.data.data });
    }
  } catch (e) {}
}
export async function PinnChat(payload) {
  let axios = (await import("axios")).default;
  try {
    const AxiosInstance = axios.create({
      baseURL: CHAT_URL,
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
      baseURL: CHAT_URL,
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
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: CHAT_URL,
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
  store.dispatch({
    type: "GRP",
    payload: { mes: res.data.data, ch: payload.first },
  });
}

export async function getContacts() {
  let axios = (await import("axios")).default;
  const AxiosInstance = axios.create({
    baseURL: CHAT_URL,
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
  store.dispatch({ type: "GET_CONTACTS_RED", payload: res.data.data });
}
export const getMedia = async (id, media) => {
  try {
    let axios = (await import("axios")).default;
    let resp = await axios.post(
      CHAT_URL +
        `/api/v1/messages/messages_of_channel/${id}?limit=10&message_type=${media}`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ` +
            JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
        },
      }
    );
    store.dispatch({
      type: "EDIT_CHAT_INFO_MEDIA",
      payload: { id: id, data: resp.data.data, media: media },
    });
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
export async function checkForUpdate() {
  let axios = (await import("axios")).default;
  try {
    let last_date = store.getState().chat.lastNotification;
    if (
      last_date &&
      new Date().getTime() - new Date(last_date).getTime() > 120000
    ) {
      GetChats(true);
    }
  } catch (e) {}
}
//   if (
//     store.getState().chat.channels.filter((ch) => ch.id === channelId)
//       .length === 0
//   ) {
//     let ch = pusherVar.subscribe(`presence-typing-${channelId?.toString(16)}`);
//     ch.bind("client-TypingEvent", (data) => {
//       if (
//         parseInt(JSON.parse(JSON.stringify(data)).uid) !== getUserChat()?.id
//       ) {
//         store.dispatch({
//           type: "IS_TYPING_TRUE",
//           payload: JSON.parse(JSON.stringify(data)),
//         });
//       }
//     });
//     store.dispatch({
//       type: "PUSHER_RED",
//       payload: { id: channelId, channel: ch },
//     });
//   }
// };
export const makeVideoCall = async (
  channelId,
  callerName,
  callerPhoto,
  mobilePhone
) => {
  let axios = (await import("axios")).default;
  if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
    console.log(channelId, callerName, callerPhoto, mobilePhone);
  try {
    store.dispatch({ type: "CALL-LOADING", payload: "video" });
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    await axios
      .post(
        CHAT_URL + `/api/v1/messages/video_call`,
        {
          ...obj,
          payload: {
            user_id: getUserChat()?.id,
            type: "video",
            channelId: channelId,
            callerName: callerName,
            callerPhoto: callerPhoto,
            mobilePhone: mobilePhone,
          },
        },
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
          },
        }
      )
      .then((data) => {
        if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") console.log(data);
        store.dispatch({
          type: "VIDEO_CALL",
          payload: data.data.data.token,
          source: data.data.data.message,
        });
        store.dispatch({ type: "edit-call", payload: data.data.data.message });
        store.dispatch({ type: "CALL-LOADING", payload: null });
      });
  } catch (e) {
    const { toast } = await import("react-toastify");
    store.dispatch({ type: "enableNotifications" });
    toast.info("User in Another Call");
    store.dispatch({ type: "END-CALL", payload: -1 });
    console.error(e);
  }
};
export const makeVoiceCall = async (
  channelId,
  callerName,
  callerPhoto,
  mobilePhone
) => {
  try {
    let axios = (await import("axios")).default;
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    store.dispatch({ type: "CALL-LOADING", payload: "voice" });
    await axios
      .post(
        CHAT_URL + `/api/v1/messages/voice_call`,
        {
          ...obj,
          payload: {
            user_id: getUserChat()?.id,
            type: "audio",
            channelId: channelId,
            callerName: callerName,
            callerPhoto: callerPhoto,
            mobilePhone: mobilePhone,
          },
        },
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
          },
        }
      )
      .then((data) => {
        store.dispatch({
          type: "AUDIO_CALL",
          payload: data.data.data.token,
          source: data.data.data.message,
        });
        store.dispatch({ type: "edit-call", payload: data.data.data.message });
        store.dispatch({ type: "CALL-LOADING", payload: null });
      });
  } catch (e) {
    console.error(e);
    store.dispatch({ type: "enableNotifications" });
    const { toast } = await import("react-toastify");
    toast.info("User in Another Call");
    store.dispatch({ type: "CALL-LOADING", payload: null });
  }
};
export const AnswerCall = async (channelId, messageId) => {
  try {
    let axios = (await import("axios")).default;
    store.dispatch({ type: "CALL-LOADING", payload: "call" });
    let status = null;
    store.dispatch({ type: "enableNotifications" });
    const { toast } = await import("react-toastify");
    toast.info(
      translate(
        "Initialize Call please wait..",
        store.getState().homepage.language
      )
    );
    await axios
      .get(CHAT_URL + `/api/v1/messages/${messageId}/users`, {
        headers: {
          Authorization:
            "Bearer " +
            JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
        },
      })
      .then((data) => {
        if (
          data.data.data.filter(
            (user) => parseInt(user.user.id) === parseInt(getUserChat().id)
          )[0].status === "active"
        )
          status = true;
        else {
          status = false;
        }
      });

    if (status === false) {
      await axios
        .post(
          CHAT_URL + `/api/v1/channels/${channelId}/agora_token`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ` +
                JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
            },
          }
        )
        .then((data) => {
          Answer(channelId, messageId);
          store.dispatch({ type: "ANSWER_CALL", payload: data.data.data });
        });
    } else {
      store.dispatch({ type: "enableNotifications" });
      const { toast } = await import("react-toastify");
      toast.info(
        translate(
          "Call Answered from another account",
          store.getState().homepage.language
        )
      );
      store.dispatch({ type: "USER_END_CALL", payload: messageId });
    }
    store.dispatch({ type: "CALL-LOADING", payload: null });
  } catch (e) {
    store.dispatch({ type: "CALL-LOADING", payload: null });
    console.error(e);
  }
};
export const InCall = async (channelId, messageId) => {
  try {
    let axios = (await import("axios")).default;
    if (messageId) {
      let obj =
        typeof channelId === "string" && channelId.includes("ch")
          ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
          : { channel_id: channelId };
      await axios
        .post(
          CHAT_URL + `/api/v1/messages/in_another_call/${messageId}`,
          { ...obj },
          {
            headers: {
              Authorization:
                `Bearer ` +
                JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
            },
          }
        )
        .then(() => {});
    }
  } catch (error) {
    console.log(error);
  }
};
export const RefuseCall = async (channelId, messageId, duration) => {
  try {
    let axios = (await import("axios")).default;
    if (messageId) {
      let obj =
        typeof channelId === "string" && channelId.includes("ch")
          ? {
              receiver_user_id: parseInt(channelId.split("ch-")[1]),
              duration_in_seconds: duration || 0,
            }
          : { channel_id: channelId, duration_in_seconds: duration || 0 };

      await axios
        .post(
          CHAT_URL + `/api/v1/messages/refuse_call/${messageId}`,
          { ...obj, payload: { target: "web" } },
          {
            headers: {
              Authorization:
                `Bearer ` +
                JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
            },
          }
        )
        .then(() => {
          store.dispatch({ type: "USER_END_CALL", payload: messageId });
        });
    }
  } catch (e) {
    console.error(e);
  }
};
export const Answer = async (channelId, messageId) => {
  try {
    let axios = (await import("axios")).default;
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    await axios
      .post(
        CHAT_URL + `/api/v1/messages/answer_call/${messageId}`,
        { ...obj },
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
          },
        }
      )
      .then(() => {});
  } catch (e) {}
};
export const GetChatDetails = async (id) => {
  try {
    let axios = (await import("axios")).default;
    let resp = await axios.get(CHAT_URL + `/api/v2/channels/${id}/media`, {
      headers: {
        Authorization:
          `Bearer ` +
          JSON.parse(localStorage.getItem("USER-CHAT")).access_token,
      },
    });
    store.dispatch({
      type: "EDIT_CHAT_INFO",
      payload: { id: id, data: resp.data.data },
    });
  } catch (e) {}
};
