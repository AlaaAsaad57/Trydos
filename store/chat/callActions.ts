import { store } from "store";
import { getUserChat, translateFunction } from "utils/functions";

export const makeVideoCall = async (
  channelId,
  callerName,
  callerPhoto,
  mobilePhone
) => {
  let axios = (await import("axios")).default;

  try {
    store.dispatch({ type: "CALL-LOADING", payload: "video" });
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    await axios
      .post(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          `/api/v1/messages/video_call`,
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
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
          },
        }
      )
      .then((data) => {
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
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          `/api/v1/messages/voice_call`,
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
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
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

    const { toast } = await import("react-toastify");
    toast.info(
      translateFunction(
        "Initialize Call please wait..",
        store.getState().homepage.language
      )
    );
    await axios
      .get(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          `/api/v1/messages/${messageId}/users`,
        {
          headers: {
            Authorization:
              "Bearer " +
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
          },
        }
      )
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
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
            `/api/v1/channels/${channelId}/agora_token`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ` +
                JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
            },
          }
        )
        .then((data) => {
          Answer(channelId, messageId);
          store.dispatch({ type: "ANSWER_CALL", payload: data.data.data });
        });
    } else {
      const { toast } = await import("react-toastify");
      toast.info(
        translateFunction(
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
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
            `/api/v1/messages/in_another_call/${messageId}`,
          { ...obj },
          {
            headers: {
              Authorization:
                `Bearer ` +
                JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
            },
          }
        )
        .then(() => {});
    }
  } catch (error) {}
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
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
            `/api/v1/messages/refuse_call/${messageId}`,
          { ...obj, payload: { target: "web" } },
          {
            headers: {
              Authorization:
                `Bearer ` +
                JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
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
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          `/api/v1/messages/answer_call/${messageId}`,
        { ...obj },
        {
          headers: {
            Authorization:
              `Bearer ` +
              JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
          },
        }
      )
      .then(() => {});
  } catch (e) {}
};
