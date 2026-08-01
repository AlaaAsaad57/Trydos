import { useAppStore } from "store";

import { SendMessage } from "store/chat/actions";
import { getUserChat, LogError, translateFunction } from "utils/functions";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { GetTicket } from "utils/UploadUtils";

export const getUser: any = () => {
  return useAppStore.getState().userChat;
};

export const getMessageStatusIcon = (status_array, mid) => {
  if (mid) {
    return (
      <svg
        className="message-type-icon"
        fill="#3C3C3C"
        version="1.1"
        id="Capa_1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="10px"
        height="10px"
        viewBox="0 0 473.068 473.068"
      >
        <g>
          <g id="Layer_2_31_">
            <g>
              <path d="M355.507,181.955c8.793-6.139,29.39-20.519,29.39-55.351v-71.77h9.814c4.49,0,8.17-3.679,8.17-8.169v-38.5       c0-4.49-3.681-8.165-8.17-8.165H78.351c-4.495,0-8.165,3.675-8.165,8.165v38.5c0,4.491,3.67,8.169,8.165,8.169h9.82v73.071       c0,34.499,10.502,42.576,29.074,53.89l80.745,49.203v20.984c-20.346,12.23-73.465,44.242-80.434,49.107       c-8.793,6.135-29.384,20.51-29.384,55.352v61.793h-9.82c-4.495,0-8.165,3.676-8.165,8.166v38.498c0,4.49,3.67,8.17,8.165,8.17       h316.361c4.49,0,8.17-3.68,8.17-8.17V426.4c0-4.49-3.681-8.166-8.17-8.166h-9.814v-63.104c0-34.493-10.508-42.572-29.069-53.885       l-80.745-49.202v-20.987C295.417,218.831,348.537,186.822,355.507,181.955z M252.726,272.859l87.802,53.5       c6.734,4.109,10.333,6.373,12.001,9.002c1.991,3.164,2.963,9.627,2.963,19.768v63.104H117.574v-61.793       c0-19.507,9.718-26.289,16.81-31.242c5.551-3.865,54.402-33.389,85.878-52.289c4.428-2.658,7.135-7.441,7.135-12.611v-37.563       c0-5.123-2.671-9.883-7.053-12.55l-87.54-53.339l-0.265-0.165c-6.741-4.105-10.336-6.369-11.998-9.009       c-1.992-3.156-2.968-9.626-2.968-19.767V54.835h237.918v71.77c0,19.5-9.718,26.288-16.814,31.235       c-5.546,3.872-54.391,33.395-85.869,52.295c-4.427,2.658-7.134,7.442-7.134,12.601v37.563       C245.675,265.431,248.346,270.188,252.726,272.859z"></path>
              <path d="M331.065,154.234c0,0,5.291-4.619-2.801-3.299c-19.178,3.115-53.079,15.133-92.079,15.133s-57-11-82.507-11.303       c-5.569-0.066-5.456,3.629,0.937,7.391c6.386,3.758,63.772,35.681,71.671,40.08c7.896,4.389,12.417,4.05,20.786,0       C259.246,196.334,331.065,154.234,331.065,154.234z"></path>
              <path d="M154.311,397.564c-6.748,6.209-9.978,10.713,5.536,10.713c12.656,0,139.332,0,155.442,0       c16.099,0,9.856-5.453,2.311-12.643c-14.576-13.883-45.416-23.566-82.414-23.566       C196.432,372.068,169.342,383.723,154.311,397.564z"></path>
            </g>
          </g>
        </g>
      </svg>
    );
  }
  if (
    status_array.filter(
      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id),
    )[0]?.is_watched === true ||
    status_array.filter(
      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id),
    )[0]?.watched_at
  )
    return (
      <>
        <img
          src="/icons/chat/read.svg"
          className="status-icon w-[10px] h-[10px]"
        />
      </>
    );
  else if (
    status_array.filter(
      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id),
    )[0]?.is_received === 1 ||
    status_array.filter(
      (a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id),
    )[0]?.received_at
  )
    return (
      <img
        src="/icons/chat/recieved.svg"
        className="status-icon w-[10px] h-[10px]"
      />
    );
  else {
    return (
      <img
        src="/icons/chat/sent.svg"
        className="status-icon w-[10px] h-[10px]"
      />
    );
  }
};
export const isNew = (ch) => {
  let a = ch?.filter(
    (mes) =>
      !mes.message_type.name.includes("Call") &&
      String(mes.sender_user_id) !== String(getUserChat()?.id) &&
      mes.message_status.filter(
        (st) => String(st.user_id) === String(getUserChat()?.id),
      )[0]?.is_watched === false &&
      mes.auth_message_status.delete_for_all === false,
  ).length;
  return a;
};
export const getCallType = (type) => {
  const { language } = useAppStore.getState();
  const translate = (key, lang) => {
    return translateFunction(key, lang);
  };
  if (type.duration <= 0) {
    return (
      <>
        <img src="/icons/chat/missedCall.svg" className="w-[15px] h-[15px]" />{" "}
        {translate("Missed Call", language)}
      </>
    );
  } else if (
    parseInt(type.sender) !== parseInt(getUserChat().id) &&
    type.duration >= 0
  ) {
    return (
      <>
        <img src="/icons/chat/IncomingCall.svg" className="w-[15px] h-[15px]" />{" "}
        {translate("Incoming Call", language)}
      </>
    );
  } else if (parseInt(type.sender) === parseInt(getUserChat().id)) {
    return (
      <>
        <img src="/icons/chat/outgoingCall.svg" className="w-[15px] h-[15px]" />{" "}
        {translate("Outgoing Call", language)}
      </>
    );
  }
};
export const getTwoLetters = (name) => {
  if (name && name !== "UnKnown User") {
    if (name?.includes(" ")) {
      let words = name.split(" ");
      if (words.length > 1) return `${words[0][0]}${words[1][0]}`;
    } else {
      return `${name[0] + name[1]}`;
    }
  } else {
    return "";
  }
};
export const getNew = (chatData, activeChat = null) => {
  let a = [];
  chatData.forEach((c) => {
    if (c && isNew(c?.messages) > 0)
      if (!activeChat || c.id !== activeChat?.id) a.push(c);
  });
  return a;
};
export const getNewCalls = (calls) => {
  let a = 0;
  return isNew(calls);
};
export const forwardMessage = async (m, activeChat) => {
  const { sendMessage, setForwardMessage, setMain } = useAppStore.getState();
  const user = await getUser();
  let i = Math.random();

  if (
    m.message_type.name === "TextMessage" ||
    m.message_type === "TextMessage"
  ) {
    SendMessage(
      {
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        content: m.message_content?.content,
        parent_message_id: null,
        is_forward: 1,
        message_type: "TextMessage",
        mid: i,
        cid: activeChat?.id,
      },
      false,
    );
    sendMessage({
      act: activeChat,
      message: {
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        sender_user_id: user.id,
        message_type: { name: "TextMessage" },
        message_content: { content: m.message_content?.content },
        created_at: new Date(),
        mid: i,
        message_status: [
          {
            is_watched: false,
            is_received: 0,
            user_id: user.id,
          },
          {
            is_received: 0,
            is_watched: false,
            user_id: activeChat.channel_members.filter(
              (a) => parseInt(a.user_id) !== parseInt(user.id),
            )[0]?.user_id,
          },
        ],
        type: "pending",
        is_forward: 1,
        cid: activeChat?.id,
      },
      isNew: false,
    });
    setForwardMessage(null);
    setMain("chat");
  }
  if (
    m.message_type.name === "ImageMessage" ||
    m.message_type === "ImageMessage"
  ) {
    SendMessage(
      {
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        content: [{ file_path: m.message_files[0]?.file_path, caption: "" }],
        parent_message_id: null,
        message_type: "ImageMessage",
      },
      false,
    );
    sendMessage({
      act: activeChat,
      message: {
        mid: i,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        sender_user_id: user.id,
        message_type: { name: "ImageMessage" },
        type: "pending",
        created_at: new Date(),
        is_forward: 1,
        message_status: [
          {
            is_watched: false,
            is_received: 0,
            user_id: user.id,
          },
          {
            is_received: 0,
            is_watched: false,
            user_id: activeChat.channel_members.filter(
              (a) => parseInt(a.user_id) !== parseInt(user.id),
            )[0]?.user_id,
          },
        ],
        message_files: [
          { file_path: m.message_files[0]?.file_path, caption: "" },
        ],
        cid: activeChat?.id,
      },
      isNew: false,
    });
    setForwardMessage(null);
    setMain("chat");
  }
  if (
    m.message_type.name === "VoiceMessage" ||
    m.message_type === "VoiceMessage"
  ) {
    SendMessage(
      {
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        content: [{ file_path: m.message_files[0]?.file_path, caption: "" }],
        parent_message_id: null,
        message_type: "VoiceMessage",
      },
      false,
    );
    sendMessage({
      act: activeChat,
      message: {
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        sender_user_id: user.id,
        message_type: { name: "VoiceMessage" },
        type: "pending",

        created_at: new Date(),
        message_status: [
          {
            is_watched: false,
            is_received: 0,
            user_id: user.id,
          },
          {
            is_received: 0,
            is_watched: false,
            user_id: activeChat.channel_members.filter(
              (a) => parseInt(a.user_id) !== parseInt(user.id),
            )[0]?.user_id,
          },
        ],
        message_files: [
          { file_path: m.message_files[0]?.file_path, caption: "" },
        ],
      },
      isNew: false,
    });
    setForwardMessage(null);
    setMain("chat");
  }
  if (
    m.message_type.name === "VideoMessage" ||
    m.message_type === "VideoMessage"
  ) {
    SendMessage(
      {
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        content: [{ file_path: m.message_files[0]?.file_path, caption: "" }],
        parent_message_id: null,
        message_type: "VideoMessage",
      },
      false,
    );
    sendMessage({
      act: activeChat,
      message: {
        is_forward: 1,
        mid: i,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        sender_user_id: user.id,
        message_type: { name: "VideoMessage" },
        type: "pending",

        created_at: new Date(),
        message_status: [
          {
            is_watched: false,
            is_received: 0,
            user_id: user.id,
          },
          {
            is_received: 0,
            is_watched: false,
            user_id: activeChat.channel_members.filter(
              (a) => parseInt(a.user_id) !== parseInt(user.id),
            )[0]?.user_id,
          },
        ],
        message_files: [
          { file_path: m.message_files?.[0]?.file_path, caption: "" },
        ],
        cid: activeChat?.id,
      },
      isNew: false,
    });
    setForwardMessage(null);
    setMain("chat");
  }
  if (
    m.message_type.name === "FileMessage" ||
    m.message_type === "FileMessage"
  ) {
    SendMessage(
      {
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        content: [{ file_path: m.message_files[0]?.file_path, caption: "" }],
        parent_message_id: null,
        message_type: "FileMessage",
      },
      false,
    );
    sendMessage({
      act: activeChat,
      message: {
        mid: i,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        sender_user_id: user.id,
        message_type: { name: "FileMessage" },
        type: "pending",
        is_forward: 1,
        created_at: new Date(),
        message_status: [
          {
            is_watched: false,
            is_received: 0,
            user_id: user.id,
          },
          {
            is_received: 0,
            is_watched: false,
            user_id: activeChat.channel_members.filter(
              (a) => parseInt(a.user_id) !== parseInt(user.id),
            )[0]?.user_id,
          },
        ],
        message_files: [
          { file_path: m.message_files[0]?.file_path, caption: "" },
        ],
        cid: activeChat?.id,
      },
      isNew: false,
    });
    setForwardMessage(null);
    setMain("chat");
  }
  if (
    m.message_type.name === "ShareProduct" ||
    m.message_type === "ShareProduct"
  ) {
    SendMessage(
      {
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        content: { ...m.message_content.content },
        parent_message_id: null,
        message_type: "ShareProduct",
      },
      false,
    );
    sendMessage({
      act: activeChat,
      message: {
        mid: i,
        receiver_user_id: activeChat.channel_members.filter(
          (a) => parseInt(a.user_id) !== parseInt(user.id),
        )[0]?.user_id,
        // receiver_role_id: activeChat.channel_members.filter(
        //   (a) => parseInt(a.user_id) !== parseInt(user.id)
        // )[0]?.role_id,
        // sender_role_id: user.role_id,
        sender_user_id: user.id,
        message_type: { name: "ShareProduct" },
        type: "pending",
        is_forward: 1,
        created_at: new Date(),
        message_status: [
          {
            is_watched: false,
            is_received: 0,
            user_id: user.id,
          },
          {
            is_received: 0,
            is_watched: false,
            user_id: activeChat.channel_members.filter(
              (a) => parseInt(a.user_id) !== parseInt(user.id),
            )[0]?.user_id,
          },
        ],
        message_content: { ...m.message_content.content },
        cid: activeChat?.id,
      },
      isNew: false,
    });
    setForwardMessage(null);
    setMain("chat");
  }
};

const uploadFile = async (file_name, file) => {
  let formData = new FormData();
  formData.append("file", file);
  formData.append("file_name", file_name);
    let ticket=await GetTicket("chat",false,1);
  try {
    let response = await fetch( process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL+"/gated/chat/upload_file",{
     headers:{"X-Upload-Ticket":ticket},
      method: "POST",
      body: formData,
  
    });
    // @ts-ignore
    if (!response.success) {
      let JsonResponse=await response.json();
      throw new Error(JsonResponse?.message);
    }
     let JsonResponse=await response.json();
    return JsonResponse;
  } catch (err) {
    LogError({
      error: err,
      scenario: "Upload file for chat",
      file_name: file,
    });
    return null;
  }
};

export const upload = async (file) => {
  let currentFile = file;
  let a = "",
    b = "";
  let response = await uploadFile(
    currentFile.name?.split(".")[0] || "image",
    file,
  );
  if (response && response.code === 200 && response.data?.file_path) {
    a = response.data.file_path;
    b = currentFile.name;
    return { path: a, name: b };
  } else {
    throw new Error(response?.message || "Failed to upload file");
  }
};
export function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(","),
    mime = arr[0]?.match(/:(.*?);/)[1],
    bstr = atob(arr[arr.length - 1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
export function blobToDataURL(blob, callback) {
  var a = new FileReader();
  a.onload = function (e) {
    callback(e.target.result);
  };
  a.readAsDataURL(blob);
}
export const showDate = (d) => {
  const { language } = useAppStore.getState();

  var days = [
    translateFunction("Sunday", language),
    translateFunction("Monday", language),
    translateFunction("Tuesday", language),
    translateFunction("Wednesday", language),
    translateFunction("Thursday", language),
    translateFunction("Friday", language),
    translateFunction("Saturday", language),
  ];
  let now = new Date();
  let nowString = `${now.getFullYear()}-${
    now.getMonth() + 1 > 9
      ? (now.getMonth() + 1).toString()
      : "0" + (now.getMonth() + 1).toString()
  }-${
    now.getDate() > 9
      ? now.getDate()
      : "0" + parseInt(now.getDate().toString()).toString()
  }`;
  d = new Date(d);
  let date_mes = new Date(d);
  d = `${d.getFullYear()}-${
    d.getMonth() + 1 > 9
      ? (d.getMonth() + 1).toString()
      : "0" + (d.getMonth() + 1).toString()
  }-${d.getDate() > 9 ? d.getDate() : "0" + parseInt(d.getDate()).toString()}`;

  const day = days[new Date(d).getDay()];
  if (d === nowString)
    return `${
      date_mes.getHours() > 9 ? date_mes.getHours() : "0" + date_mes.getHours()
    }:${
      date_mes.getMinutes() > 9
        ? date_mes.getMinutes()
        : "0" + date_mes.getMinutes()
    }`;
  else if (new Date(nowString).getTime() - new Date(d).getTime() === 86400000) {
    return translateFunction("Yesterday", language);
  } else if (
    new Date(nowString).getTime() - new Date(d).getTime() <
    86400000 * 6
  )
    return day;
  else return language === "ar" ? d.toLocaleString("ar-EG") : d;
};
