import React from 'react'
import ReplyIcon from "../svg/rep.svg"
import CancelIcon from "../svg/cancel.svg"
import VideoIcon from "../svg/video.svg"
import AudioIcon from "../svg/audio.svg"
import out from "../svg/output.png"
import { useSelector } from 'react-redux'
import ProfilePicture from "public/images/profileNo.png"
import Image from 'next/image'
function ReplyMessage({message,cancel}) {
    const activeChat=useSelector((state)=>state.chat.activeChat)
    const showContent=()=>{
        if(message.message_type.name==="TextMessage"){
            return(
            <>
            {message.message_content.content}
            </>
            )
        }
        if(message.message_type.name==="ImageMessage"){
          return(
              <>
            <img src={message.type?message.message_content[0]?.file_path: message.message_content[0]?.file_path}/> Image
              </>)
        }
        if(message.message_type.name==="VideoMessage"){
            return(
                <>
                 <VideoIcon className='message-type-icon'></VideoIcon> Video
                </>
            )
        }
        if(message.message_type.name==="VoiceMessage"){
            return(
                <>
                <AudioIcon className='message-type-icon'></AudioIcon> Audio
                </>)
        }
        if(message.message_type.name==="FileMessage"){
            return(<>
            <Image alt="file" width={26} height={20} src={out.src} style={{width:"15px",height:"18px",borderRadius:"0px"}}/> File
            </>)
        }
    }
  return (
    <div className='reply-message-container'>
        <div className='reply-icon'>
            <ReplyIcon></ReplyIcon>
        </div>
        <div className='cancel-reply-icon' onClick={()=>cancel()} style={{marginLeft:"15px",cursor:'pointer'}}>
            <CancelIcon></CancelIcon>
        </div>
        <div className={`${message.message_type.name!=="TextMessage"&&"inline-flex"} reply-content`}>
            {showContent()}
        </div>
        <div className='reply-message-user-avatar'>
         </div>

    </div>
  )
}

export default ReplyMessage