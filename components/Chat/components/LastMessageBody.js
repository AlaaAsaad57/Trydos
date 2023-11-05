import React from 'react'
import { getMessageStatusIcon, getUser } from '../chatsFunctions'
import ImageIcon from "../svg/image.svg"
import VideoIcon from "../svg/video.svg"
import AudioIcon from "../svg/audio.svg"
function LastMessageBody({message,status}) {
    const getMessage=()=>{
        if(message.message_type.name==="TextMessage"){
            return(
                <>
                {message.sender_user_id===getUser()?.id && getMessageStatusIcon(message.message_status)}
                <p>{message.message_content.content}</p>
                </>
            )
        }
        if(message.message_type.name==="ImageMessage"){
            return(
            <>
            <ImageIcon className='message-type-icon' ></ImageIcon> Image
            </>)
        }
        if(message.message_type.name==="VoiceMessage"){
            return(
                <>
                <AudioIcon className='message-type-icon' ></AudioIcon> Audio
                </>)
        }
        if(message.message_type.name==="VideoMessage"){
            return(
                <>
                <VideoIcon className='message-type-icon'></VideoIcon> Video
                </>)
        }
        if(message.message_type.name==="FileMessage"){
            return(
                <>
                 File
                </>) 
        }
    }
  return (
    <div className={`last-message-body ${message.message_type.name!=="TextMessage"&&'inline-flex'}`} style={{maxHeight:status?"15px":"40px"}}>
        {getMessage()}
    </div>
  )
}

export default LastMessageBody