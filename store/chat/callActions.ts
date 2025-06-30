import { useAppStore } from "store";
import { getUserChat, translateFunction } from "utils/functions";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
export const makeVideoCall = async (
  channelId,
  callerName,
  callerPhoto,
  mobilePhone
) => {
  const { setCallLoading, setVideoCall, endCall, setAudioCall, editCall } =
    useAppStore.getState();
  try {
    setCallLoading("video");
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    let response = await fetchData({
      url: `/api/v1/messages/video_call`,
      body: JSON.stringify({
        ...obj,
        payload: {
          user_id: getUserChat()?.id,
          type: "video",
          channelId: channelId,
          callerName: callerName,
          callerPhoto: callerPhoto,
          mobilePhone: mobilePhone,
        },
      }),
      method: "POST",
      server: "chat",
      reqTitle: "Video Call",
    });
    setVideoCall(response.data.data.token, response.data.data.message);
    editCall(response.data.data.message);
    setCallLoading(null);
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
  console.log(channelId, callerName, callerPhoto, mobilePhone);
  try {
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    setCallLoading("voice");
    let response = await fetchData({
      url: `/api/v1/messages/voice_call`,
      body: JSON.stringify({
        ...obj,
        payload: {
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
      }),
      method: "POST",
      server: "chat",
      reqTitle: "Voice Call",
    });
    setAudioCall(response.data.data.token, response.data.data.message);
    editCall(response.data.data.message);
    setCallLoading(null);
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
    setCallLoading("call");
    let status = null;

    showSuccessNotification(
      translateFunction("Initialize Call please wait..", language)
    );
    let response = await fetchData({
      url: `/api/v1/messages/${messageId}/users`,
      method: "GET",
      server: "chat",
      reqTitle: "Answer Call",
    });
    if (
      response.data.data.filter(
        (user) => parseInt(user.user.id) === parseInt(getUserChat().id)
      )[0].status === "active"
    )
      status = true;
    else {
      status = false;
    }
    if (status === false) {
      let response2 = await fetchData({
        url: `/api/v1/channels/${channelId}/agora_token`,
        method: "POST",
        server: "chat",
        reqTitle: "Agora Token",
      });
      Answer(channelId, messageId);
      answerCall(response2.data.data);
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
    if (messageId) {
      let obj =
        typeof channelId === "string" && channelId.includes("ch")
          ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
          : { channel_id: channelId };
      await fetchData({
        url: `/api/v1/messages/in_another_call/${messageId}`,
        body: JSON.stringify({ ...obj }),
        method: "POST",
        server: "chat",
        reqTitle: "In Another Call",
      });
    }
  } catch (error) {}
};
export const RefuseCall = async (channelId, messageId, duration) => {
  const { endCall } = useAppStore.getState();
  try {
    // Clear user's call state
    await fetchData({
      url: `/api/v1/end_call`,
      reqTitle: "End Call",
      method: "POST",
      server: "chat",
      body: JSON.stringify({ user_id: getUserChat()?.id }),
    });

    if (messageId) {
      let obj =
        typeof channelId === "string" && channelId.includes("ch")
          ? {
              receiver_user_id: parseInt(channelId.split("ch-")[1]),
              duration_in_seconds: duration || 0,
            }
          : { channel_id: channelId, duration_in_seconds: duration || 0 };

      await fetchData({
        url: `/api/v1/messages/refuse_call/${messageId}`,
        body: JSON.stringify({ ...obj, payload: { target: "web" } }),
        method: "POST",
        server: "chat",
        reqTitle: "Refuse Call",
      });
      endCall(messageId);
    }
  } catch (e) {
    console.error(e);
  }
};
export const Answer = async (channelId, messageId) => {
  try {
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    await fetchData({
      url: `/api/v1/messages/answer_call/${messageId}`,
      body: JSON.stringify({ ...obj }),
      method: "POST",
      server: "chat",
      reqTitle: "Answer Call",
    });
  } catch (e) {}
};
