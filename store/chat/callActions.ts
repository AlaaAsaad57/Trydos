import { useAppStore } from "store";
import { getUserChat, translateFunction } from "utils/functions";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";

export const makeVideoCall = async (
  channelId,
  callerName,
  callerPhoto,
  mobilePhone
) => {
  let axios = (await import("axios")).default;
  const { setCallLoading, setVideoCall, endCall, setAudioCall, editCall } =
    useAppStore.getState();
  try {
    setCallLoading("video");
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
        setVideoCall(data.data.data.token, data.data.data.message);
        editCall(data.data.data.message);

        setCallLoading(null);
      });
  } catch (e) {
    showErrorNotification(translateFunction("User in Another Call"));
    endCall(-1);
    console.error(e);
  }
};
export const makeVoiceCall = async (
  channelId,
  callerName,
  callerPhoto,
  mobilePhone
) => {
  const { setCallLoading, setAudioCall, editCall, language } =
    useAppStore.getState();

  try {
    let axios = (await import("axios")).default;
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    setCallLoading("voice");
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
        setAudioCall(data.data.data.token, data.data.data.message);
        editCall(data.data.data.message);
        setCallLoading(null);
      });
  } catch (e) {
    console.error(e);

    showErrorNotification(translateFunction("User in Another Call"));
    setCallLoading(null);
  }
};
export const AnswerCall = async (channelId, messageId) => {
  const { setCallLoading, language, answerCall, endCall } =
    useAppStore.getState();

  try {
    let axios = (await import("axios")).default;
    setCallLoading("call");
    let status = null;

    showSuccessNotification(
      translateFunction("Initialize Call please wait..", language)
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
          answerCall(data.data.data);
        });
    } else {
      showErrorNotification(
        translateFunction("Call Answered from another account", language)
      );
      endCall(messageId);
    }
    setCallLoading(null);
  } catch (e) {
    setCallLoading(null);
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
  const { endCall } = useAppStore.getState();
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
          endCall(messageId);
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
