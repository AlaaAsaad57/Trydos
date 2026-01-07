export const getAgoraToken = async (channel_id, token, mid, uid, fcm) => {
  let tok, status, req;

  let [AgoraTokenResponse, UserResponse] = await Promise.all([
    fetch(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v1/channels/${channel_id}/agora_token`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    ),
    fetch(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v1/messages/${mid}/users`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
        credentials: "omit",
      }
    ),
  ]);
  let AgoraTokenData = await AgoraTokenResponse.json();
  tok = AgoraTokenData.data;
  let UserData = await UserResponse.json();
  if (
    UserData.data.filter((user) => parseInt(user.user.id) === parseInt(uid))[0]
      ?.status === "active"
  ) {
    status = true;
  } else {
    status = false;
  }
  await AnswerWebView(token, mid, fcm);
  return [tok, status];
};
export const getAgoraTokenForInit = async (channel_id, token, mid) => {
  let AgoraTokenResponse = await fetch(
    process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
      `/api/v1/channels/${channel_id}/agora_token`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        accept: "application/json",
      },
      credentials: "omit",
    }
  );
  let AgoraTokenData = await AgoraTokenResponse.json();
  let tok = AgoraTokenData.data;

  return tok;
};
export const getUserInfo = async (token, channel) => {
  let datas = [];
  let UserResponse = await fetch(
    process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + `/api/v1/channels/${channel}`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
      credentials: "omit",
    }
  );
  let UserData = await UserResponse.json();
  datas = [
    UserData.data.channel_name,
    UserData.data.mobile_phone,
    UserData.data.photo_path,
  ];
  return datas;
};
export const Decline = async (token, mid, duration) => {
  let response = await fetch(
    process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
      `/api/v1/messages/refuse_call/${mid}`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        accept: "application/json",
      },
      body: JSON.stringify({
        duration_in_seconds: duration ?? 0,
        payload: { target: "webview" },
      }),
      credentials: "omit",
    }
  );
  response = await response.json();
};
export const StartTalking = async (token, mid) => {
  await fetch(
    process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
      `/api/v1/messages/start_talking/${mid}`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
      credentials: "omit",
    }
  );
};
export const AnswerWebView = async (token, messageId, fcm) => {
  let obj = {};
  if (fcm?.length) {
    obj = { fcm_token: fcm };
  }
  try {
    let res = await fetch(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        `/api/v1/messages/answer_call/${messageId}`,
      {
        method: "POST",
        body: JSON.stringify({ ...obj }),
        headers: {
          Authorization: "Bearer " + token,
          accept: "application/json",
        },
      }
    );
    let data = await res.json();
    alert(
      JSON.stringify({
        data,
        body: obj,
        fcm,
        url: `/api/v1/messages/answer_call/${messageId}`,
      })
    );
  } catch (e) {}
};
