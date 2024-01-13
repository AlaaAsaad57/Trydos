import React from 'react'
import ArrowIcon from "../svg/arrow.svg"
import VideoIcon from "../svg/vcall.svg"
import CallIcon from "../svg/call.svg"
import profile from "public/images/profileNo.png"
import { useDispatch, useSelector } from 'react-redux';
import { getNew, getTwoLetters } from '../chatsFunctions';
import Image from 'next/image';
import { getUserChat } from 'utils/functions'
import { EstablishChannel, makeVideoCall, makeVoiceCall } from 'store/chat/actions'
function ChatHeader({chats,activeChat,openDetails}) {
    const dispatch=useDispatch()
    const callLoading=useSelector((state)=>state.chat.callLoading)
  return (
    <div className="chat-screen-top">
    <ArrowIcon
      onClick={() => {
        dispatch({ type: "MAIN", payload: "main" });
        dispatch({ type: "OPEN-CHAT", payload: null });
        dispatch({type:"REPLY-MESSAGE",payload:null})
      }}
    ></ArrowIcon>
    {getNew(chats,activeChat).length>0&&<span className="new-chat-num">{getNew(chats,activeChat).length>0&&getNew(chats,activeChat).length}</span>}
    <div className="user-top-chat">
      {activeChat && activeChat.channel_members && (
        <div className="img-uer" onClick={()=>openDetails()}>
          {(!activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu')&&activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path)?
         <Image
         alt="user"
         width={40}
         height={40}
           src={
             (activeChat &&
             activeChat.channel_members &&
             activeChat.channel_members.filter(
               (a) =>
                 parseInt(a.user_id) !==
                 parseInt(getUserChat()?.id) 
             )[0]?.user?.photo_path)
           }
         />:
          activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user.name?
          <div className='text-avatar' style={{width:"40px",height:"40px",}}>
          {getTwoLetters(activeChat.channel_members.filter(
              (a) =>
                parseInt(a?.user_id) !==
                parseInt(getUserChat()?.id)
            )[0]?.user?.name||activeChat?.channel_members.filter(
                (a) =>
                  parseInt(a.user_id) !==
                  parseInt(getUserChat()?.id)
              )[0]?.user?.username)}
             </div>
             :
             <Image width={40} height={40} alt="user" src={profile.src}/>
          }

        </div>
      )}
      {activeChat && activeChat.channel_members && (
        <div className="user-name-top-chat">
         {activeChat.status&& <div className="user-status">{activeChat.status!=='null'&&activeChat.status}</div>}
          {activeChat.channel_members &&
            activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUserChat()?.id)
            )[0] &&
            activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUserChat()?.id)
            )[0]?.user &&
            activeChat.channel_members.filter(
              (a) =>
                parseInt(a.user_id) !==
                parseInt(getUserChat()?.id)
            )[0]?.user.name||'User-'+activeChat.id
          
          }
        </div>
      )}
    </div>
    <div className="chat-top-contact">
    {/* <VideoIcon onClick={()=>dispatch({ type: "VIDEO_CALL" })} className="vcall" ></VideoIcon>
      <CallIcon onClick={()=> dispatch({ type: "AUDIO_CALL" })} className="call" ></CallIcon>EstablishChannel */}
      <VideoIcon className={`${(callLoading==='video') && 'loading-svg'} vcall`} onClick={()=>{!callLoading&&makeVideoCall(activeChat.id,activeChat.channel_members.filter((s)=>parseInt(s.user_id)!==parseInt(getUserChat()?.id))[0]?.user.name,activeChat.channel_members.filter((s)=>parseInt(s.user_id)!==parseInt(getUserChat()?.id))[0]?.user?.photo_path,activeChat.channel_members.filter((s)=>parseInt(s.user_id)!==parseInt(getUserChat()?.id))[0]?.user.mobile_phone); }} ></VideoIcon>
      <CallIcon className={`${(callLoading==='voice') && 'loading-svg'} call`} onClick={()=> {!callLoading&&makeVoiceCall(activeChat.id,activeChat.channel_members.filter((s)=>parseInt(s.user_id)!==parseInt(getUserChat()?.id))[0]?.user.name,activeChat.channel_members.filter((s)=>parseInt(s.user_id)!==parseInt(getUserChat()?.id))[0]?.user?.photo_path,activeChat.channel_members.filter((s)=>parseInt(s.user_id)!==parseInt(getUserChat()?.id))[0]?.user.mobile_phone);}} ></CallIcon>
    </div>
  </div>
  )
}

export default ChatHeader