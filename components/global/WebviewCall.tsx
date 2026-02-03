"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
const WebViewVideoCall = dynamic(() => import("./WebViewVideoCall"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        backgroundColor: "#000",
        color: "#FFF",
        flexDirection: "column",
      }}
    >
      <img
        src="/icons/chat/CallInProg.svg"
        style={{
          marginBottom: "10px",
          transform: "scale(1.5)",
          marginRight: "10px",
        }}
      />
      Loading Call Information...
    </div>
  ),
});
const WebViewVoiceCall = dynamic(() => import("./WebViewVoiceCall"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        backgroundColor: "#000",
        color: "#FFF",
        flexDirection: "column",
      }}
    >
      <img
        src="/icons/chat/CallInProg.svg"
        style={{
          marginBottom: "10px",
          transform: "scale(1.5)",
          marginRight: "10px",
        }}
      />
      Loading Call Information...
    </div>
  ),
});
const CallComponentWidget = dynamic(() => import("./CallComponentWidget"), {
  ssr: false,
});
import {
  getAgoraToken,
  Decline,
  getAgoraTokenForInit,
  getUserInfo,
} from "./WebViewActions";

import { LogError } from "utils/functions";
function WebviewCall() {
  const [error, setError] = useState(null);
  const getToken = (tok) => {
    let str = "";
    tok.split("").map((ch) => {
      if (ch === " ") {
        str += "+";
      } else {
        str += ch;
      }
    });
    return str;
  };
  const searchParams = useSearchParams();
  const [data, setData] = useState({
    token: searchParams.get("token") && getToken(searchParams.get("token")),
    sender_user_id: searchParams.get("uid"),
    channel_id: searchParams.get("ch_id"),
    type: searchParams.get("type"),
    action: searchParams.get("action"),
    actionInit: searchParams.get("action"),
    authToken: searchParams.get("authToken"),
    msgId: searchParams.get("message_id"),
    ring: searchParams.get("ring-3"),
    error: null,
    loading: false,
    photo: "",
    status: null,
    fcm: searchParams?.get("fcm"),
    is_private: searchParams?.get("is_private")?.length
      ? searchParams?.get("is_private")
      : null,
  });
  const [userData, setUserData] = useState({ name: "", phone: "", photo: "" });
  const onAnswer = async (bool) => {
    try {
      if (!data.loading) {
        setData({
          ...data,
          loading: true,
          fcm: searchParams?.get("fcm"),
          is_private: searchParams?.get("is_private")?.length
            ? searchParams?.get("is_private")
            : null,
        });
        let [token, status] = await getAgoraToken(
          data.channel_id,
          data.authToken,
          data.msgId,
          data.sender_user_id,
          searchParams?.get("fcm"),
        );

        if (status) {
          window.location.href = `/callInProg`;
        } else {
          setData({
            ...data,
            token: token,
            action: "sent",
            fcm: searchParams?.get("fcm"),
            is_private: searchParams?.get("is_private")?.length
              ? searchParams?.get("is_private")
              : null,
          });
          if (searchParams?.get("is_private")?.length) {
            window.location.href = `/call_direct?authToken=${data.authToken}&token=${token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}&is_private=${searchParams?.get("is_private")}`;
          } else {
            window.location.href = `/call_direct?authToken=${data.authToken}&token=${token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}`;
          }
        }
      }
    } catch (error) {
      let errorObj = {
        type: "front-end-calls-webview",
        message: error.message,
        url: window.location.href,
        user_id: data.sender_user_id,
        token: data.authToken,
        data: data,
      };
      LogError(errorObj);
      setData({ ...data, error: error.message });
    }
  };
  const initCall = async () => {
    try {
      if (!data.loading) {
        setData({
          ...data,
          loading: true,
          fcm: searchParams?.get("fcm"),
        });
        let token = await getAgoraTokenForInit(
          data.channel_id,
          data.authToken,
          data.msgId,
        );
        if (token) {
          setData({ ...data, token: token, action: "sent" });
          if (searchParams?.get("is_private"))
            window.location.href = `/call_direct?authToken=${data.authToken}&token=${token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}&ring=true&is_private=${searchParams?.get("is_private")}`;
          else
            window.location.href = `/call_direct?authToken=${data.authToken}&token=${token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}&ring=true`;
        } else {
          setError("failed to initialize call ..Try again");
          setTimeout(() => {
            window.location.href = "/endCall";
          }, 3000);
        }
      }
    } catch (error) {
      console.error(error);
      let errorObj = {
        type: "front-end-calls-webview",
        message: error.message,
        url: window.location.href,
        user_id: data.sender_user_id,
        token: data.authToken,
        data: data,
      };
      LogError(errorObj);
      setData({ ...data, error: error.message });
    }
  };
  const onDecline = async (duration) => {
    if (!data.loading) {
      setData({ ...data, loading: true });
      await Decline(data.authToken, data.msgId, duration).catch((e) => {
        setError(e.message);
      });
      window.location.href = "/endCall";
    }
  };
  useEffect(() => {
    if (!data.token && data.token !== "undefined" && data.action === "sent") {
      initCall();
    }
  }, []);
  useEffect(() => {
    if (data.action === "receive") {
      getUserInfo(data.authToken, data.channel_id).then((data) => {
        setUserData({
          ...userData,
          name: data[0],
          phone: data[1],
          photo: data[2],
        });
      });
    }
    if (data.action === "sent" && data.token) {
      getUserInfo(data.authToken, data.channel_id).then((data) => {
        setUserData({
          ...userData,
          name: data[0],
          phone: data[1],
          photo: data[2],
        });
      });
    }
  }, []);
  return (
    <>
      {error && (
        <div
          className="error"
          style={{
            display: "flex",
            justifyContent: "flex-start",
            padding: "10px",
            flexDirection: "column",
            maxWidth: "100%",
            zIndex: "9999999999",
            position: "absolute",
            backgroundColor: "white",
          }}
        >
          <span>url:{window.location.href}</span>
          <span>error:{data.error}</span>
          <span>mesgID:{data.msgId}</span>
        </div>
      )}
      {!data.token && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            backgroundColor: "#000",
            color: "#FFF",
            flexDirection: "column",
          }}
        >
          <img
            src="/icons/chat/CallInProg.svg"
            style={{ marginBottom: "10px", transform: "scale(1.5)" }}
          />
          {error ? error : "  Loading Call Information..."}
        </div>
      )}
      {data.authToken && data.action === "receive" && (
        <CallComponentWidget
          data={data}
          userData={userData}
          onDecline={(e) => {
            onDecline(e);
          }}
          onAnswer={() => {
            onAnswer(true);
          }}
          type={data.type}
        />
      )}
      {data.authToken &&
        data.token &&
        data.action !== "receive" &&
        data.type === "voice" && (
          <WebViewVoiceCall
            onDecline={onDecline}
            data={data}
            active={userData?.photo}
            userData={userData}
            urlparam={`/call_direct?authToken=${data.authToken}&token=${data.token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}`}
          />
        )}
      {data.authToken &&
        data.token &&
        data.action !== "receive" &&
        data.type === "video" && (
          <WebViewVideoCall
            onDecline={onDecline}
            data={data}
            userData={userData}
            active={userData?.photo}
            urlparam={`/call_direct?authToken=${data.authToken}&token=${data.token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}`}
          />
        )}
      <button
        className="top-[10px] right-[10px] p-2 absolute"
        style={{
          top: "10px",
          right: "10px",
          zIndex: "99999999999999",
          backgroundColor: "#fafafa",
          padding: "8px",
          position: "absolute",
          color: "#1d1d1d",
          textTransform: "uppercase",
          fontSize: "20px",
          fontWeight: "bold",
          borderRadius: "10px",
        }}
        onClick={() => {
          navigator.clipboard.writeText(window.location.href).then(
            function () {},
            function () {},
          );
          alert(window.location.href);
        }}
      >
        debug
      </button>
    </>
  );
}

export default WebviewCall;
