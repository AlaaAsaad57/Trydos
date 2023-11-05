import React from 'react'
import { getNew, getTwoLetters, getUser } from '../chatsFunctions';
import { useDispatch } from 'react-redux';
import PointIcon from "../svg/point.svg"
import Image from 'next/image';
function NewChatsSide({activeChat,chats}) {
    const dispatch=useDispatch()
  return (
    <div className="new-chats">
    {activeChat && activeChat?.id && getNew(chats,activeChat).filter((cv) => cv.id !== activeChat && activeChat?.id && activeChat?.id && cv?.channel_type?.slug !== "team").map((a) => {
      return (
        <div className='new-chat' onClick={() => { dispatch({ type: "OPEN-CHAT", payload: a }); dispatch({ type: "WATCH_CHANNEL", payload: a.id }); }}>
          <PointIcon></PointIcon>

           <div className='img-cont'>
           {a.channel_members.filter((ada) => ada.user_id !== getUser().id)[0]?.user?.photo_path&&!a.channel_members.filter((ada) => ada.user_id !== getUser().id)[0]?.user?.photo_path?.includes(a.channel_members.filter((ada) => ada.user_id !== getUser().id)[0]?.user?.name)?
            <Image width={30} height={30}  alt='new-user' src={ a.channel_members.filter((ada) => ada.user_id !== getUser().id)[0]?.user?.photo_path }/>:
          <div className='min-text-avatar'>
          {getTwoLetters(a.channel_members.filter((ada) => ada.user_id !== getUser().id)[0]?.user?.name||a.channel_members.filter((ada) => ada.user_id !== getUser().id)[0]?.user?.username)}
          </div>}
           </div>


        </div>
      )
    })}
  </div>
  )
}

export default NewChatsSide