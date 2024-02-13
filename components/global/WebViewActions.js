import axios from "axios";
import { CHAT_URL } from "utils/endpointConfig";
import { Answer } from "store/chat/actions";

export const AnswerCall = async (token, mid, chid) => {
  let req = await axios
    .post(
      CHAT_URL + `/api/v1/messages/answer_call/${messageId}`,
      {},
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
    .then((data) => {});
};
export const getAgoraToken = async (channel_id, token, mid, uid) => {
  let tok, status, req;
  req = await axios
    .post(
      CHAT_URL + `/api/v1/channels/${channel_id}/agora_token`,
      {},
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
    .then((data) => {
      tok = data.data.data;
    });
  await axios
    .get(CHAT_URL + `/api/v1/messages/${mid}/users`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    .then((data) => {
      if (
        data.data.data.filter(
          (user) => parseInt(user.user.id) === parseInt(uid)
        )[0].status === "active"
      )
        status = true;
      else {
        status = false;
      }
      //    alert(JSON.stringify(data.data.data))
    });
  if (!status) await AnswerWebView(token, mid);
  return [tok, status];
};
export const getAgoraTokenForInit = async (channel_id, token, mid) => {
  let tok, req;
  req = await axios
    .post(
      CHAT_URL + `/api/v1/channels/${channel_id}/agora_token`,
      {},
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
    .then((data) => {
      tok = data.data.data;
    })
    .catch((e) => {
      alert(e.message);
    });
  return tok;
};
export const getUserInfo = async (token, channel) => {
  let datas = [];
  await axios
    .get(CHAT_URL + "/api/v1/channels/" + channel, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    .then((data) => {
      datas = [
        data.data.data.channel_name,
        data.data.data.mobile_phone,
        data.data.data.photo_path,
      ];
    });
  return datas;
};
export const Decline = async (token, mid, duration) => {
  let req = await axios
    .post(
      CHAT_URL + `/api/v1/messages/refuse_call/${mid}`,
      { duration_in_seconds: duration || 0 },
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
    .then((data) => {});
};
export const StartTalking = async (token, mid) => {
  let req = await axios
    .post(CHAT_URL + `/api/v1/messages/start_talking/${mid}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    .then((data) => {});
};
export const AnswerWebView = async (token, messageId) => {
  try {
    await axios
      .post(
        CHAT_URL + `/api/v1/messages/answer_call/${messageId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ` + token,
          },
        }
      )
      .then(() => {});
  } catch (e) {}
};
