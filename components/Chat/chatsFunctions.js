import ReadIcon from "./svg/read.svg"
import SentIcon from "./svg/sent.svg"
import ReceiveIcon from "./svg/recieved.svg"
import MissedCall from "./svg/missedCall.svg"
import IncomingCall from "./svg/IncomingCall.svg"
import OutgoingCall from "./svg/outgoingCall.svg"
import {index} from "store"
import axios from "axios"
import { CHAT_URL } from "utils/endpointConfig"
import { SendMessage } from "store/chat/actions"
import { getUserChat } from "utils/functions"
export const FILE_SERVER=CHAT_URL
export const getUser=()=>{
    return(
        (localStorage.getItem("USER-CHAT")&&JSON.parse(localStorage.getItem("USER-CHAT"))) || null
        )
}
export const getMessageStatusIcon=(status_array)=>{
    if(status_array.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.is_watched === true||status_array.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.watched_at)
        return(
        <>
        <ReadIcon className="status-icon" ></ReadIcon>
        </>)
    else if(status_array.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.is_received === 1||status_array.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.received_at)
    return(
        <ReceiveIcon className="status-icon" ></ReceiveIcon>
    )
    else {
        return(
            <SentIcon className="status-icon"></SentIcon>
        )
    }
}
export const    getMessageTime = (lastMessage) => {
    if (lastMessage.created_at) {
        let d = new Date(lastMessage.created_at)
        return (`${d.getHours() > 9 ? d.getHours() : "0" + d.getHours()}:${d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes()}`)
    }
}
export const isNew = (ch) => {
    let a = ch?.filter((mes) =>(!mes.message_type.name.includes('Call'))&& mes.sender_user_id !== getUserChat()?.id && mes.message_status.filter((st) => st.user_id === getUserChat()?.id)[0]?.is_watched === false).length
    return (a)
  }
  export const getCallType=(type)=>{
    if(type==='missed'){
        return(<>
        <MissedCall></MissedCall> Missed Call</>)
    }
    else if(type==="incoming"){
        return(
        <>
          <IncomingCall></IncomingCall> Incoming Call
        </>)
    }
    else{
        return(
        <>
          <OutgoingCall></OutgoingCall> Outgoing Call
        </>)
    }

  }
  export const getTwoLetters=(name)=>{
    if(name&&name!=="UnKnown User"){
    if(name?.includes(' ')){
        let words=name.split(' ');
        if(words.length>1)
        return(`${words[0][0]}${words[1][0]}`)
    }
    else{
        return(`${name[0]+name[1]}`)
    }}
    else{
      return ""
    }
  }
  export const getNew = (chatData,activeChat) => {
    let a = []
    chatData.forEach((c) => {
      if (isNew(c.messages) > 0)
        if ( c.id !== activeChat?.id)
          a.push(c)
    })
    return a
  }
  
export const forwardMessage = (m, activeChat) => {


   
    let i = Math.random();
   
    if (m.message_type.name === "TextMessage" || m.message_type === "TextMessage") {
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
        )[0]?.role_id,
        sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
        content: m.message_content?.content,
        parent_message_id: null,
        is_forward: 1,
        message_type: "TextMessage",
        mid: i,
        cid: activeChat?.id,
      },activeChat?.id?i:false)
      index.dispatch({
        type: "SEND-MESSAGE",
        payload: {
          act: activeChat,
          message: {
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.role_id,
            sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
            sender_user_id: JSON.parse(localStorage.getItem("USER-CHAT")).id,
            message_type: { name: "TextMessage" },
            message_content: { content: m.message_content?.content },
            created_at: new Date(),
            mid: i,
            message_status: [{ is_watched: false, is_received: 0, user_id: (localStorage.getItem("USER-CHAT") && JSON.parse(localStorage.getItem("USER-CHAT")).id) }
              , {
              is_received: 0, is_watched: false, user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
              )[0]?.user_id
            }],
            type: "pending",
            is_forward: 1,
            cid: activeChat?.id,
          },
          isNew:activeChat?.id?i:false
        },
      });
      index.dispatch({ type: "FORWARD-MESSAGEs", payload: null })
    }
    if (m.message_type.name === "ImageMessage" || m.message_type === "ImageMessage") {
      SendMessage( {
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
        )[0]?.role_id,
        sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
        content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
        parent_message_id: null,
        message_type: "ImageMessage",
      },activeChat?.id?i:false)
      index.dispatch({
        type: "SEND-MESSAGE",
        payload: {
          act: activeChat,
          message: {
            mid: i,
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.role_id,
            sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
            sender_user_id: JSON.parse(localStorage.getItem("USER-CHAT")).id,
            message_type: { name: "ImageMessage" },
            type: "pending",
            created_at: new Date(),
            is_forward: 1,
            message_status: [{ is_watched: false, is_received: 0, user_id: (localStorage.getItem("USER-CHAT") && JSON.parse(localStorage.getItem("USER-CHAT")).id) }
              , {
              is_received: 0, is_watched: false, user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
              )[0]?.user_id
            }],
            message_content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
            cid: activeChat?.id,
          },
          isNew:activeChat?.id?i:false
        },
      });
      index.dispatch({ type: "FORWARD-MESSAGEs", payload: null })
    }
    if (m.message_type.name === "VoiceMessage" || m.message_type === "VoiceMessage") {
     SendMessage({
      mid: i,
      cid: activeChat?.id,
      is_forward: 1,
      receiver_user_id: activeChat.channel_members.filter(
        (a) =>
          parseInt(a.user_id) !==
          parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
      )[0]?.user_id,
      receiver_role_id: activeChat.channel_members.filter(
        (a) =>
          parseInt(a.user_id) !==
          parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
      )[0]?.role_id,
      sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
      content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
      parent_message_id: null,
      message_type: "VoiceMessage",
    },activeChat?.id?i:false)
      index.dispatch({
        type: "SEND-MESSAGE",
        payload: {
          act: activeChat,
          message: {
            mid: i,
            cid: activeChat?.id,
            is_forward: 1,
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.role_id,
            sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
            sender_user_id: JSON.parse(localStorage.getItem("USER-CHAT")).id,
            message_type: { name: "VoiceMessage" },
            type: "pending",
            is_forward: 1,
            created_at: new Date(),
            message_status: [{ is_watched: false, is_received: 0, user_id: (localStorage.getItem("USER-CHAT") && JSON.parse(localStorage.getItem("USER-CHAT")).id) }
              , {
              is_received: 0, is_watched: false, user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
              )[0]?.user_id
            }],
            message_content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
            cid: activeChat?.id,
          },
          isNew:activeChat?.id?i:false
        },
      });
      index.dispatch({ type: "FORWARD-MESSAGEs", payload: null })
    }
    if (m.message_type.name === "VideoMessage" || m.message_type === "VideoMessage") {
     SendMessage({
      mid: i,
      cid: activeChat?.id,
      is_forward: 1,
      receiver_user_id: activeChat.channel_members.filter(
        (a) =>
          parseInt(a.user_id) !==
          parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
      )[0]?.user_id,
      receiver_role_id: activeChat.channel_members.filter(
        (a) =>
          parseInt(a.user_id) !==
          parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
      )[0]?.role_id,
      sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
      content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
      parent_message_id: null,
      message_type: "VideoMessage",
    },activeChat?.id?i:false)
      index.dispatch({
        type: "SEND-MESSAGE",
        payload: {
          act: activeChat,
          message: {
            is_forward: 1,
            mid: i,
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.role_id,
            sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
            sender_user_id: JSON.parse(localStorage.getItem("USER-CHAT")).id,
            message_type: { name: "VoiceMessage" },
            type: "pending",
            is_forward: 1,
            created_at: new Date(),
            message_status: [{ is_watched: false, is_received: 0, user_id: (localStorage.getItem("USER-CHAT") && JSON.parse(localStorage.getItem("USER-CHAT")).id) }
              , {
              is_received: 0, is_watched: false, user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
              )[0]?.user_id
            }],
            message_content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
            cid: activeChat?.id,
          },
          isNew:activeChat?.id?i:false
        },
      });
      index.dispatch({ type: "FORWARD-MESSAGEs", payload: null })
    }
    if (m.message_type.name === "FileMessage" || m.message_type === "FileMessage") {
      SendMessage({
        mid: i,
        cid: activeChat?.id,
        is_forward: 1,
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
        )[0]?.role_id,
        sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
        content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
        parent_message_id: null,
        message_type: "FileMessage",
      },activeChat?.id?i:false)
      index.dispatch({
        type: "SEND-MESSAGE",
        payload: {
          act: activeChat,
          message: {
            mid: i,
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
            )[0]?.role_id,
            sender_role_id: JSON.parse(localStorage.getItem("USER-CHAT")).role_id,
            sender_user_id: JSON.parse(localStorage.getItem("USER-CHAT")).id,
            message_type: { name: "FileMessage" },
            type: "pending",
            is_forward: 1,
            created_at: new Date(),
            message_status: [{ is_watched: false, is_received: 0, user_id: (localStorage.getItem("USER-CHAT") && JSON.parse(localStorage.getItem("USER-CHAT")).id) }
              , {
              is_received: 0, is_watched: false, user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)
              )[0]?.user_id
            }],
            message_content: [{ file_path: m.message_content[0]?.file_path, caption: "" }],
            cid: activeChat?.id,
          },
          isNew:activeChat?.id?i:false
        },
      });
      index.dispatch({ type: "FORWARD-MESSAGEs", payload: null })
    }
  
}

const uploadFile = async (file_name, file, onUploadProgress) => {
  let formData = new FormData();
  formData.append("file", file);
  formData.append("file_name", file_name);

  return axios.post(
    CHAT_URL + "/api/v1/upload_file",
    formData
  );
};

export const upload = async (file) => {
  let currentFile = file;
  let a = "",b='';
  await uploadFile(currentFile.name?.split(".")[0] || "image", file)
    .then((response) => {
      a = response.data.data.file_path;
      b = currentFile.name;
      return ({path:response.data.data.file_path,name:currentFile.name});
    })
    .catch((e) => {
      console.error(e);
    });
  return {path:a,name:b};
};
export function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','),
      mime = arr[0]?.match(/:(.*?);/)[1],
      bstr = atob(arr[arr.length - 1]), 
      n = bstr.length, 
      u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}