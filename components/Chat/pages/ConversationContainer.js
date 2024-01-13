import React,{useState,useEffect,useRef} from 'react'
import Recorder from 'components/Chat/components/Recorder';
import ChatHeader from 'components/Chat/components/ChatHeader';
import ChatMessage from 'components/Chat/components/ChatMessage';
import {useStopwatch} from 'react-timer-hook'
import { useSelector,useDispatch } from 'react-redux';
import MicIcon from "../svg/mic.svg"
import RedMicIcon from "../svg/redmic.svg"
import WaveIcon from "../svg/wave.svg"
import ShareIcon from "../svg/sharechat.svg"
import WebcamCapture from "components/Chat/components/CameraComponent"
import PlusIcon from "../svg/chatplus.svg"
import CameraIcon from "../svg/camera.svg"
import SendIcon from "../svg/sendbutton.svg"
import { dataURLtoFile, upload } from '../chatsFunctions';
import { toast } from 'react-toastify';
import { getUser } from '../chatsFunctions';
import ReplyMessage from 'components/Chat/components/ReplyMessage';
import ChatInfo from 'components/Chat/components/ChatInfo';
import { useCallback } from 'react';
import Observable from 'components/Chat/components/ChatHistoryElement';
import Image from 'next/image';
import { InitPusherChannel, SendMessage, getMessagesBetweenMessage, getPage } from 'store/chat/actions';
import { SSRDetect, translate } from 'utils/functions';
import dynamic from "next/dynamic"
import { EventTrack } from 'store/homepage/actions';
const VideoCall =dynamic(()=>import('components/Chat/components/VideoCall', { ssr: false }))
const VoiceCall =dynamic(()=>import('components/Chat/components/VoiceCall', { ssr: false }))
function ConversationContainer({ViewedScreen,active,loading,first}) {

  const [vid, setVid] = useState(null);
  const imageFile =useRef(null)
  const [imgs, setImgs] = useState(null);
  const mid=useSelector((state)=>state.chat.mid)
  const AgoraToken=useSelector((state)=>state.chat.AgoraToken)
  const openChat=useSelector((state)=>state.chat.openChat)
  const qouted=useSelector((state)=>state.chat.qouted)
  const call = useSelector(state => state.chat.call)
  const replyMessage=useSelector((state)=>state.chat.replyMessage);
  const refs=useSelector((state)=>state.chat.refs)
  const channels=useSelector((state)=>state.chat.channels)
  const sendStatues=(desc)=>{
    let obj={id:activeChat.id,uid:getUser()?.id,desc:desc}
    let a=channels.filter((cv)=>cv.id===activeChat.id)[0]
    if(a&&a.channel){
 
     a.channel.trigger("client-TypingEvent",obj)
    }


  }
  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
    useStopwatch({ autoStart: true });
  const [isRecording, setRecording] = useState(false);
  const [blobUrl, setblobUrl] = useState(null);
  const blobs = useRef();
  const AudioRef = useRef();
  const onStop = (blo) => {
    sendStatues(null)
    setRecording(false);
    reset();
    setblobUrl(blo);
    blobs.current = blo;
  };
  const showRoute = (mes, prev, next) => {
    if(prev&&prev.message_content&&prev.message_content.length>0&&prev.message_content[0]?.file_path==="false"){
      return "lonely"
    }
    let type = "lonely";
    if ((!prev && !next)||(next?.parent_message||prev?.parent_message||mes?.parent_message)) {
      return "lonely";
    }
    if (mes.type === "call") return type;
    if (
      (prev &&
        (mes.sender_user_id !== prev.sender_user_id ||
          (mes.sender_user_id === prev.sender_user_id &&
            prev.type === "call")) &&
        next &&
        (mes.sender_user_id === next.sender_user_id) &&
        next.sender_user_id !== "call") ||
      (!prev &&
        mes.sender_user_id === next.sender_user_id &&
        next.sender_user_id !== "call")
    ) {
      if(showDate(mes.created_at)===showDate(prev?.created_at))
      type = "first-chat";
    } else if (
      prev &&
      next &&
      mes.sender_user_id === prev.sender_user_id &&
      prev.type !== "call" &&
      mes.sender_user_id === next.sender_user_id &&
      next.sender_user_id !== "call"
    ) {
      if(showDate(mes?.created_at)===showDate(prev?.created_at)&&showDate(mes?.created_at)==showDate(next?.created_at))
      type = "middle-chat";
    } else if (
      prev &&
      mes.sender_user_id === prev.sender_user_id &&
      prev.type !== "call" &&
      ((next && mes.sender_user_id !== next.sender_user_id) ||
        !next ||
        next.sender_user_id === "call") ||(next?.parent_message&&prev.sender_user_id===mes.sender_user_id)
    ) {
      if(showDate(mes?.created_at)===showDate(prev?.created_at))
      type = "last-chat";
    }
    return type;
  };
  const [mics, setMic] = useState(false);
  const activeChat = useSelector((state) => state.chat.activeChat);
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  var a = 0;
  const showDuration = () => {
    return `${minutes > 9 ? minutes : "0" + minutes}:${
      seconds > 9 ? seconds : "0" + seconds
    }`;
  };
  const sendAudio = async (i) => {
    dispatch({type:"REFS"})
    if (blobs.current) {
      setRecording(false);
      sendStatues(null)
      setMic(false);
   
      reset();
      var reader = new FileReader();
      reader.readAsDataURL(blobs.current);
      var file = new File([blobs.current], "wave-" + i);

      reader.onloadend = function () {
        var base64data = reader.result;
        dispatch({
          type: "SEND-MESSAGE",
          payload: {
            isNew:typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,
            act: {...activeChat,id:activeChat.id||'ch-'},
            message: {
              parent_message: replyMessage,
              receiver_user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(getUser()?.id)
              )[0]?.user_id,
              receiver_role_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(getUser()?.id)
              )[0]?.role_id,
              sender_role_id: getUser().role_id,
              sender_user_id: getUser()?.id,
              message_type: { name: "VoiceMessage" },
              message_content: [{ file_path: base64data }],
              created_at:new Date(),
              type: "pending",
              mid: i,
              message_status:   [{ is_watched: false, is_received: 0,user_id:(localStorage.getItem("USER-CHAT")&&getUser()?.id) }
              ,{is_received:0,is_watched:false,user_id:activeChat.channel_members.filter(
    (a) =>
      parseInt(a.user_id) !==
      parseInt(getUser()?.id)
  )[0]?.user_id}],
              cid: activeChat.id,
            },
          },
        });
      };

      let pat = await upload(file);
     
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: [{ file_path: pat.path,file_name:pat.name }],
        parent_message_id: replyMessage?.id,
        message_type: "VoiceMessage",
        mid: i,
        cid: activeChat.id,
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)
    }
  };
  const sendPhoto = (m, i,type) => {
    dispatch({type:"REFS"})
    toBase64(m, i,type);
  };
  const send_mes = (data, type) => {
    document.querySelector("#scroled")?.scrollIntoView({block:"center",inline:"center"})
   EventTrack('send-message',{type:type});
    if (type === "TextMessage") {
      let i = Math.random();
      SendMessage( {
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: data,
       parent_message_id: replyMessage?.id,
        message_type: "TextMessage",
        mid: i,
        cid: activeChat.id,
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)
      dispatch({
        type: "SEND-MESSAGE",
        payload: { isNew:typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,
          act: activeChat,
          message: {
            parent_message: replyMessage,
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUser()?.id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUser()?.id)
            )[0]?.role_id,
            sender_role_id: getUser().role_id,
            sender_user_id: getUser()?.id,
            message_type: { name: "TextMessage" },
            message_content: { content: data },
            created_at:new Date(),
            mid: i,
            message_status:   [{ is_watched: false, is_received: 0,user_id:(localStorage.getItem("USER-CHAT")&&getUser()?.id) }
  ,{is_received:0,is_watched:false,user_id:activeChat.channel_members.filter(
    (a) =>
      parseInt(a.user_id) !==
      parseInt(getUser()?.id)
  )[0]?.user_id}],
            type: "pending",
            cid: activeChat.id,
          },
        },
      });
      sendStatues(null)
    }
    if (type === "ImageMessage") {
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT").id))
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT").id))
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: [{ file_path: data }],
        parent_message_id: replyMessage?.id,
        message_type: "ImageMessage",
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)
      dispatch({
        type: "SEND-MESSAGE",
        payload: { isNew:typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,
          act: activeChat,
          message: {
            parent_message: replyMessage,
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUser()?.id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUser()?.id)
            )[0]?.role_id,
            sender_role_id: getUser().role_id,
            message_type: { name: "ImageMessage" },
            type: "pending",
            created_at:new Date(),
            message_status:  [{ is_watched: false, is_received: 0,user_id:(localStorage.getItem("USER-CHAT")&&getUser()?.id) }
  ,{is_received:0,is_watched:false,user_id:activeChat.channel_members.filter(
    (a) =>
      parseInt(a.user_id) !==
      parseInt(getUser()?.id)
  )[0]?.user_id}],
            message_content: [{ file_path: data }],
            cid: activeChat.id,
          },
        },
      });
    }
    if (type === "VoiceMessage") {
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT").id))
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(JSON.parse(localStorage.getItem("USER-CHAT").id))
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: [{ file_path: data }],
      parent_message_id: replyMessage?.id,
        message_type: "VoiceMessage",
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)
      dispatch({
        type: "SEND-MESSAGE",
        payload: { isNew:typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,
          act: activeChat,
          message: {
            parent_message: replyMessage,
            receiver_user_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUser()?.id)
            )[0]?.user_id,
            receiver_role_id: activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUser()?.id)
            )[0]?.role_id,
            sender_role_id: getUser().role_id,
            message_type: { name: "VoiceMessage" },
            type: "pending",
            created_at:new Date(),
            message_status:   [{ is_watched: false, is_received: 0,user_id:(localStorage.getItem("USER-CHAT")&&getUser()?.id) }
  ,{is_received:0,is_watched:false,user_id:activeChat.channel_members.filter(
    (a) =>
      parseInt(a.user_id) !==
      parseInt(getUser()?.id)
  )[0]?.user_id}],
            message_content: [{ file_path: data }],
            cid: activeChat.id,
          },
        },
      });
    }
    dispatch({type:"REFS"})
  };
  const toBase64 = (file, i,type) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result);

        // dispatch({type:"SEND-MESSAGE",payload:{act:activeChat,message:{sender:"me",sent:"19:12",recived:"",read:"",content:base64data,type:"audio"}}})
        dispatch({
          type: "SEND-MESSAGE",
          payload: { isNew:typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,
            act: activeChat,
            message: {
              parent_message: replyMessage,
              receiver_user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(getUser()?.id)
              )[0]?.user_id,
              receiver_role_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(getUser()?.id)
              )[0]?.role_id,
              sender_role_id: getUser().role_id,
              sender_user_id: getUser()?.id,
              message_type: { name: type },
              message_content: [{ file_path: reader.result }],
              type: "pending",
              created_at:new Date(),
              message_status:  [{ is_watched: false, is_received: 0,user_id:(localStorage.getItem("USER-CHAT")&&getUser()?.id) }
  ,{is_received:0,is_watched:false,user_id:activeChat.channel_members.filter(
    (a) =>
      parseInt(a.user_id) !==
      parseInt(getUser()?.id)
  )[0]?.user_id}],
              mid: i,
              cid: activeChat.id,
            },
          },
        });
      
        //send_mes(message,"TextMessage");
        //dispatch({type:"SEND-MESSAGE",payload:{act:activeChat,message:{sender:"me",sent:"19:12",recived:"19:12",read:"19:12",content:reader.result,type:"img"}}})
      };
      reader.onerror = (error) => reject(error);
    });
  const uploadPhoto = () => {
    sendStatues("Sending Photo...")
    let Image = document.createElement("input");
    Image.onblur=()=>{
   ;
    }
    Image.onchange = async (e) => {
      let i = Math.random();
      if(e.target.files[0]?.type.includes("image"))
     { sendPhoto(e.target.files[0], i,"ImageMessage");
     
      let pat = await upload(e.target.files[0]);
     
      sendStatues(null)
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: [{ file_path: pat.path,file_name:pat.name }],
      parent_message_id: replyMessage?.id,
        message_type: "ImageMessage",
        mid: i,
        cid: activeChat.id,
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)
    }
      else if(e.target.files[0]?.type.includes("audio")){
        sendVid(e.target.files[0],i,"VoiceMessage")
      }
      else if(e.target.files[0]?.type.includes("video")){
        sendVid(e.target.files[0],i,"VideoMessage")
      }
      else{
        sendVid(e.target.files[0],i,"FileMessage")
      }
    };
    setTimeout(() => {
    sendStatues(null)
      
    }, 5000);
    Image.type = "file";
    Image.hidden = true;
    Image.accept = "*/*";
    Image.style = { position: "absolute", opacity: "0" };
    let i = document.body.appendChild(Image);
    i.click();
  };
  const openCameraMobile=()=>{
    sendStatues("Sending Photo...")
    let Image = document.createElement("input");
    Image.onblur=()=>{
   ;
    }
    Image.onchange = async (e) => {
      let i = Math.random();
      if(e.target.files[0]?.type.includes("image"))
     { sendPhoto(e.target.files[0], i,"ImageMessage");
    
      let pat = await upload(e.target.files[0]);
     
      sendStatues(null)
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: [{ file_path: pat.path,file_name:pat.name }],
      parent_message_id: replyMessage?.id,
        message_type: "ImageMessage",
        mid: i,
        cid: activeChat.id,
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)
    }
     
    };
    setTimeout(() => {
    sendStatues(null)
      
    }, 5000);
    Image.type = "file";
    Image.hidden = true;
    Image.accept = "image/*;capture=camera";
    Image.style = { position: "absolute", opacity: "0" };
    let i = document.body.appendChild(Image);
    i.click();
  }
  const SendCameraImg=async (imageFile)=>{
    let i=parseInt(Math.random()*1000)
    dispatch({
      type: "SEND-MESSAGE",
      payload: {
         isNew:typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,
            act: activeChat,
            message: {
              parent_message: replyMessage,
              receiver_user_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(getUser()?.id)
              )[0]?.user_id,
              receiver_role_id: activeChat.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(getUser()?.id)
              )[0]?.role_id,
              sender_role_id: getUser().role_id,
              sender_user_id: getUser()?.id,
              message_type: { name: "ImageMessage" },
              message_content: [{ file_path: imageFile }],
              type: "pending",
              created_at:new Date(),
              message_status:  [{ is_watched: false, is_received: 0,user_id:(localStorage.getItem("USER-CHAT")&&getUser()?.id) }
    ,{is_received:0,is_watched:false,user_id:activeChat.channel_members.filter(
    (a) =>
      parseInt(a.user_id) !==
      parseInt(getUser()?.id)
    )[0]?.user_id}],
              mid: i,
              cid: activeChat.id,
            },
          },
        });
        var file =dataURLtoFile(imageFile,"image-" + i+'.jpg');
       
      let pat = await upload(file);
     
      sendStatues(null)
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: [{ file_path: pat.path,file_name:pat.name }],
      parent_message_id: replyMessage?.id,
        message_type: "ImageMessage",
        mid: i,
        cid: activeChat.id,
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)
  }
  useEffect(() => {
   
  }, [blobUrl, blobs]);
  const GetMessage = useCallback((msgId, quoteId) => {

    if (activeChat?.messages.filter((f) => f.id === quoteId).length > 0) {

      var numb = quoteId?.toString()?.match(/\d/g);
      numb = numb?.join("");
      let el = document.querySelector(`#main-container-${quoteId}`)
      if (el) {
        el.scrollIntoView({ block: "center" })

        setTimeout(() => {
          el.classList.add("backdrop_msg")
        }, 300)
        setTimeout(() => {
          el.classList.remove("backdrop_msg")
        }, 1200)
      }
    }
    else{
      dispatch({type:"qouted",payload:quoteId})
      getMessagesBetweenMessage({first:activeChat?.id,second:parseInt(activeChat.messages[activeChat.messages.length-1]?.id)- parseInt(quoteId)})
    }
  },[activeChat])
  const language=useSelector((state)=>state.homepage.language)
  const showDate = (d) => {
    var days = [translate('Sunday',language), translate('Monday',language), translate('Tuesday',language), translate('Wednesday',language), translate('Thursday',language), translate('Friday',language), translate('Saturday',language)];
    let now = new Date();
    let nowString = `${now.getFullYear()}-${(now.getMonth() + 1) > 9 ? (now.getMonth() + 1).toString() : ("0" + (now.getMonth() + 1).toString())}-${(now.getDate()) > 9 ? now.getDate() : "0" + parseInt(now.getDate()).toString()}`
    d=new Date(d)
    d=`${d.getFullYear()}-${(d.getMonth() + 1) > 9 ? (d.getMonth() + 1).toString() : ("0" + (d.getMonth() + 1).toString())}-${(d.getDate()) > 9 ? d.getDate() : "0" + parseInt(d.getDate()).toString()}`

    let day = new Date(d)
    day = days[day.getDay()]
    if (d === nowString)
      return (translate("Today",language))
    else if ((new Date(nowString) - new Date(d)) === 86400000) {
      return (translate("Yesterday",language))
    }
    else if ((new Date(nowString) - new Date(d)) < (86400000 * 6))
      return (day)
    else
    return (language==='ar'?d.toLocaleString('ar-EG'):d)
  }
  useEffect(() => {
    if(first)
    setTimeout(() => {
      document.querySelector("#scroled")?.scrollIntoView({block:"center",inline:"center"});
    }, 1000);
  
   if(mid){
    setTimeout(() => {
      if(qouted){
    document.querySelector(`#main-container-${qouted}`)?.scrollIntoView({block:"center",inline:"center"})
    let el = document.querySelector(`#main-container-${qouted}`)
    if (el) {
      el.scrollIntoView({ block: "center" })

      setTimeout(() => {
        el.classList.add("backdrop_msg")
      }, 100)
      setTimeout(() => {
        el.classList.remove("backdrop_msg")
      }, 1000)}
    dispatch({type:"qouted",payload:null})}
      
    }, 300);
   }
  }, [
    first,active
  ]);
  useEffect(()=>{
    document.querySelector("#scroled").scrollIntoView({block:"center",inline:"center"});
    if(activeChat?.id)
    InitPusherChannel(activeChat.id)
  },[openChat])

  useEffect(()=>{
    document.querySelector("#scroled").scrollIntoView({block:"center",inline:"center"});
    activeChat&&activeChat.id&& dispatch({type:"WATCH_CHANNEL",payload:activeChat.id})
  }
  ,[refs])
  const chats = useSelector((state) => state.chat.data);
  const [DetailsVar,openDetails]=useState(false)
  useEffect(() => {}, []);
  const sendVid = async (e,i,type) => {
    EventTrack('send-message',{type:'videoMessage'});
     sendPhoto(e, i,type);
      let pat = await upload(e);
      sendStatues(null)
      SendMessage({
        receiver_user_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.user_id,
        receiver_role_id: activeChat.channel_members.filter(
          (a) =>
            parseInt(a.user_id) !==
            parseInt(getUser()?.id)
        )[0]?.role_id,
        sender_role_id: getUser().role_id,
        content: [{ file_path: pat.path,file_name:pat.name }],
        extra_fileds:{name:e.name,type:e.type},
      parent_message_id: replyMessage?.id,
        message_type: type,
        mid: i,
        cid: activeChat.id,
      },typeof activeChat?.id ==="string"&&activeChat?.id?.includes('ch')?activeChat.id:false,)


  };
  const [cameraEnabled,setCameraEnabled]=useState(false)
  const enableCamera=(bool)=>{
    if(!bool){
      ;
    }
   {
      navigator.mediaDevices.getUserMedia({video: true}).then((s)=>{
        setCameraEnabled(bool)
      }).catch((e)=>{
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(e,"camera-error")
        toast.error('check camera premmissions and refresh')
      })
    }
  }
  return (
    <>
       {activeChat?.id && call&&call.includes("vid") &&AgoraToken&& <VideoCall audio={call.includes("outgoing")} token={AgoraToken} name={activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.name||activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.username} active={activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.photo_path ?  (activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.photo_path) : null} channel={activeChat?.pusher_channel_name} user_id={activeChat.channel_members.filter((u) => u.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user_id} />}
      {activeChat?.id && call&&call.includes("aud") &&AgoraToken&& <VoiceCall audio={call.includes("outgoing")} token={AgoraToken} name={activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.name||activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.username} active={activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.photo_path ? (activeChat?.channel_members.filter((ada) => ada.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user?.photo_path) : null} channel={activeChat?.pusher_channel_name} user_id={activeChat.channel_members.filter((u) => u.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]?.user_id} />}
      {cameraEnabled&&window.innerWidth>800&&<div className='fixed-img-prev' >
      <div className="bac-drop" onClick={()=>enableCamera(false)}></div>
      {window.innerWidth>800?<WebcamCapture
      imageFile={imageFile}
       setImgs={(e)=>setImgs(e)}
        imgs={imgs}
         close={()=>enableCamera(false)}
          save={(d)=>{setImgs(d);}}
           send={(d)=>{SendCameraImg(d);enableCamera(false)}}/>:
           <></>
           }
       </div>}
      {(imgs || vid) &&

<div className="fixed-img-prev" style={{zIndex:"99999999999999"}}>
  <div className="bac-drop"></div>
  {
 
         <div className="svv" onClick={() => { setImgs(null); setVid(); }}> 
         <svg xmlns="http://www.w3.org/2000/svg" width="17.828" height="17.829" viewBox="0 0 17.828 17.829">
         <g id="Group_10676" data-name="Group 10676" transform="translate(-67.032 -2460.283)">
           <line id="Line_879" data-name="Line 879" y2="21.213" transform="translate(83.447 2461.697) rotate(45)" fill="none" stroke="#555" strokeLinecap="round" strokeWidth="2"/>
           <line id="Line_880" data-name="Line 880" y2="21.213" transform="translate(83.447 2476.697) rotate(135)" fill="none" stroke="#555" strokeLinecap="round" strokeWidth="2"/>
         </g>
       </svg>
       
         </div>
        }
  <div className="svv" onClick={() => { setImgs(null); setVid(); }}> 
  <svg xmlns="http://www.w3.org/2000/svg" width="17.828" height="17.829" viewBox="0 0 17.828 17.829">
  <g id="Group_10676" data-name="Group 10676" transform="translate(-67.032 -2460.283)">
    <line id="Line_879" data-name="Line 879" y2="21.213" transform="translate(83.447 2461.697) rotate(45)" fill="none" stroke="#555" strokeLinecap="round" strokeWidth="2"/>
    <line id="Line_880" data-name="Line 880" y2="21.213" transform="translate(83.447 2476.697) rotate(135)" fill="none" stroke="#555" strokeLinecap="round" strokeWidth="2"/>
  </g>
</svg>

  </div>
  {vid ? <video src={vid} controls><source src={vid} /></video> : <Image  fill sizes='100vw' alt="imgs" src={imgs} />}
</div>}
      {SSRDetect()&&<Recorder blobs={blobs} isRecording={isRecording} setblobUrl={setblobUrl} onStop={onStop}/>}
      <div
        className={"chat-screen"}
        style={{ right: ViewedScreen ? "0px" : "431px" }}
      >
       {DetailsVar&& <ChatInfo cancel={()=>openDetails(false)} activeChat={activeChat}/>}
        <ChatHeader openDetails={()=>openDetails(true)} chats={chats} activeChat={activeChat}/>
        <div className="chat-message-container">
         {!(typeof active?.id ==='string'&&active?.id?.includes('ch'))&&active?.id&& <Observable loading={loading} getNext={()=>{
            if(loading&&active?.id&&active?.messages[0])
            getPage(active?.id,active?.messages[0]?.id)
            dispatch({type:"GET_CHAT_PAGE",channel:active?.id,mid:active?.messages[0]?.id,payload:active?.messages[0]?.id})
          }}/>}
          {activeChat &&
            activeChat.messages &&
            activeChat.messages.sort((a,b)=>{
              if(a.id<b.id) return -1
              else return 1
            }
            ).map((mes, i) => {
              return(
              <>
              {(showDate(mes.created_at)!==showDate( activeChat.messages[i - 1]?.created_at)||!activeChat.messages[i - 1])
                &&
                <div className="last-date-value" >{showDate(mes.created_at)}</div>
                }
              <ChatMessage
              AudioRef={AudioRef}
              setVid={(s) => setVid(s)} setImg={(ds) => setImgs(ds)}
              GetMessage={(msgId,qoutedId)=>GetMessage(msgId,qoutedId)}
                type={showRoute(
                  mes,
                  activeChat.messages[i - 1],
                  activeChat.messages[i + 1]
                )}
                marg={
                  (i !== 0 &&
                    mes.sender_user_id !==
                      activeChat.messages[i - 1].sender_user_id) ||
                  mes.message_type.name.includes("Call") ||
                  (i !== 0 && activeChat.messages[i - 1].message_type.name.includes("call"))
                }
                message={mes}
                key={i}
              />
              </>
              
            )})}
          <div id="scroled"></div>
        </div>
        {mics ? (
        <>
        {replyMessage&&<ReplyMessage message={replyMessage} cancel={()=>{dispatch({type:"REPLY-MESSAGE",payload:null})}}/>}
        <div className={"chat-input-container" + ` ${mics && "bac40"}`}>
            <MicIcon height={"40"} style={{cursor:"pointer"}}></MicIcon>
            <div className="mic-chat">
              <span className="time-mic">{showDuration()}</span>
              <WaveIcon className="wave-svg" ></WaveIcon>
              <div
                className="cancel-button"
                onMouseUp={() => {
                  sendStatues(null)
                  setMic(false);
                  setRecording(false);
                  reset();
                }}
              >
                Cancel
              </div>
            </div>
            <ShareIcon
              onClick={() => {
                let i = Math.random();
                setRecording(false);
                setTimeout(() => {
                  sendAudio(i);
                }, 1000);
              }}
              
            ></ShareIcon>
          </div>
        </>
          
        ) : (
          <>
           {replyMessage&&<ReplyMessage message={replyMessage} cancel={()=>{dispatch({type:"REPLY-MESSAGE",payload:null})}}/>}
          <div className={"chat-input-container" + ` ${mics && "bac40"}`}>
            <PlusIcon style={{minWidth:"43px",cursor:"pointer"}}
              onClick={() => uploadPhoto()}
              height={"40"}
             
            ></PlusIcon>
            <div className="input-chat-container">
              <input
              onFocus={()=>{sendStatues("Typing...")}}
              onKeyDown={(e)=>{
                if(e.keyCode==="13"||e.key==="Enter"){
                  document.querySelector("#scroled")?.scrollIntoView({block:"center",inline:"center"})
                  send_mes(message, "TextMessage");
                  setMessage("");
                }
              }}
              onBlur={()=>{sendStatues(null)}}
                className={` input-chat ${message.length > 0 && "wid31"}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              
            </div>
            {message.length > 0 ? (
              <SendIcon style={{minWidth:"50px",cursor:"pointer"}}
                onClick={() => {
                  send_mes(message, "TextMessage");
                  setMessage("");
                }}
                
              ></SendIcon>
            ) : (
            <>
            <CameraIcon style={{minWidth:"50px",cursor:"pointer"}} className='camer-icon' onClick={()=>{enableCamera(true); if(window.innerWidth<800) openCameraMobile()}}></CameraIcon>
             <RedMicIcon  style={{cursor:"pointer"}}
                onClick={() => {
                  navigator.mediaDevices
                    .getUserMedia({ audio: true, video: false })
                    .then(
                      (stream) => {
                        setMic(true);
                        sendStatues("Recording...")
                        start();
                        setRecording(true);
                      },
                      (e) => {
                        toast.error("No available Microphone");
                        console.error(e);
                      }
                    );
                }}
                
              ></RedMicIcon>
              
            </>
             
            )}
          </div></>
        )}
      </div>
    </>
  );
}

export default ConversationContainer