import React from 'react'
import { getNew, getTwoLetters, getUser } from '../chatsFunctions';
import { useDispatch, useSelector } from 'react-redux';
import PointIcon from "../svg/point.svg"
import Image from 'next/image';
import profilePicture from "public/images/profileNo.png"
function NewChatsSide({activeChat,chats}) {
    const dispatch=useDispatch()
    const language = useSelector((state)=>state.homepage.language)
  return (
    <div className="new-chats" aria-label={language}>
    {activeChat && activeChat?.id && getNew(chats,activeChat).filter((cv) => cv.id !== activeChat && activeChat?.id && activeChat?.id && cv?.channel_type?.slug !== "team").map((a) => {
      return (
        <div className='new-chat' onClick={() => { dispatch({ type: "OPEN-CHAT", payload: a }); dispatch({ type: "WATCH_CHANNEL", payload: a.id }); }}>
          <PointIcon></PointIcon>

           <div className='img-cont'>
           {a.channel_members.filter((ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id))[0]?.user?.photo_path&&!a.channel_members.filter((ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id))[0]?.user?.photo_path?.includes(a.channel_members.filter((ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id))[0]?.user?.name)?
            <Image width={30} height={30}  alt='new-user' src={ a.channel_members.filter((ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id))[0]?.user?.photo_path }/>:
            a.channel_members.filter((ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id))[0]?.user?.name?  <div className='min-text-avatar'>
          {getTwoLetters(a.channel_members.filter((ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id))[0]?.user?.name||a.channel_members.filter((ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id))[0]?.user?.username)}
          </div>
          :
          <Image width={30} height={30}  alt='new-user'src={profilePicture}/>
          }
           </div>


        </div>
      )
    })}
  </div>
  )
}

export default NewChatsSide