import { useAppStore } from "store";
import { getUserChat, translateFunction } from "utils/functions";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { requestPermissions } from "utils/tinyUtils";
import UPDATED_API_DATA from "migration.staging";
export const makeVideoCall = async (
  channelId,
  callerName,
  callerPhoto,
  mobilePhone,
  privatePayload = null
) => {
  let permissions = await requestPermissions({ camera: true, mic: true });
  if (!permissions) {
    showErrorNotification(
      translateFunction(
        "Please enable  permissions (camera,mic) to use calls features"
      )
    );
    return;
  }
  const { setCallLoading, setVideoCall, endCall, setAudioCall, editCall } =
    useAppStore.getState();
  try {
    setCallLoading("video");
    await fetchData({
      url: `/api/v1/messages/end_call`,
      // ###EDIT###
      // url: `/api/v1/end_call`,
      reqTitle: REQUESTS_DATA.END_CALL,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ user_id: getUserChat()?.id }),
      noMessage: true,
    });
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    if (privatePayload) {
      obj = privatePayload;
    }
    await fetchData({
      url: UPDATED_API_DATA.MOD_END_CALL,

      reqTitle: REQUESTS_DATA.END_CALL,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ user_id: getUserChat()?.id }),
      noMessage: true,
    });
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
      reqTitle: REQUESTS_DATA.VIDEO_CALL,
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    setVideoCall(response.data.token, response.data.message);
    editCall(response.data.message);
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
  mobilePhone,
  privatePayload = null
) => {
  let permissions = await requestPermissions({ camera: false, mic: true });
  if (!permissions) {
    showErrorNotification(
      translateFunction(
        "Please enable  permissions (camera,mic) to use calls features"
      )
    );
    throw new Error("Permissions not granted for calls");
  }
  const { setCallLoading, setAudioCall, editCall, language } =
    useAppStore.getState();
  try {
    let obj =
      typeof channelId === "string" && channelId.includes("ch")
        ? { receiver_user_id: parseInt(channelId.split("ch-")[1]) }
        : { channel_id: channelId };
    if (privatePayload) {
      obj = privatePayload;
    }
    setCallLoading("voice");
    await fetchData({
      url: UPDATED_API_DATA.MOD_END_CALL,

      reqTitle: REQUESTS_DATA.END_CALL,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ user_id: getUserChat()?.id }),
      noMessage: true,
    });
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
      reqTitle: REQUESTS_DATA.VOICE_CALL,
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    setAudioCall(response.data.token, response.data.message);
    editCall(response.data.message);
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
      reqTitle: REQUESTS_DATA.ANSWER_CALL,
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    if (
      response.data.filter(
        (user) => parseInt(user.user.id) === parseInt(getUserChat().id as any)
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
        reqTitle: REQUESTS_DATA.AGORA_TOKEN,
      });
      if (!response2.success) {
        throw new Error(response2.message);
      }
      Answer(channelId, messageId);
      answerCall(response2.data);
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
export const InCall = async (user_id, messageId) => {
  try {
    if (messageId) {
      let obj = {};
      if (user_id) {
        obj = { ...obj, receiver_user_id: user_id };
      }

      const response = await fetchData({
        url: `/api/v1/messages/in_another_call/${messageId}`,
        body: JSON.stringify({ ...obj }),
        method: "POST",
        server: "chat",
        reqTitle: REQUESTS_DATA.IN_ANOTHER_CALL,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
export const RefuseCall = async (channelId, messageId, duration) => {
  const { endCall } = useAppStore.getState();
  try {
    // Clear user's call state
    const response = await fetchData({
      url: UPDATED_API_DATA.MOD_END_CALL,

      reqTitle: REQUESTS_DATA.END_CALL,
      method: "POST",
      server: "chat",
      body: JSON.stringify({ user_id: getUserChat()?.id }),
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    if (messageId) {
      let obj = {};
      if (duration >= 0) {
        obj = { ...obj, duration_in_seconds: duration || 0 };
      }
      const response2 = await fetchData({
        url: `/api/v1/messages/refuse_call/${messageId}`,
        body: JSON.stringify({ ...obj, payload: { target: "web" } }),
        method: "POST",
        server: "chat",
        reqTitle: REQUESTS_DATA.REFUSE_CALL,
      });
      if (!response2.success) {
        throw new Error(response2.message);
      }
      endCall(messageId);
    }
  } catch (e) {
    console.error(e);
  }
};
export const Answer = async (channelId, messageId) => {
  try {
    let obj: any = {};

    let fcm = localStorage.getItem("FB-DEVICE-TOKEN");
    if (fcm) {
      obj = { ...obj, fcm_token: fcm };
    }
    const response = await fetchData({
      url: `/api/v1/messages/answer_call/${messageId}`,
      body: JSON.stringify({ ...obj }),
      method: "POST",
      server: "chat",
      reqTitle: REQUESTS_DATA.ANSWER_CALL,
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (e) {
    console.error(e);
  }
};
