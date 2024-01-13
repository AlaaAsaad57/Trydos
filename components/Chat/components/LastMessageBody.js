import React from 'react'
import { getMessageStatusIcon, getUser } from '../chatsFunctions'
import ImageIcon from "../svg/image.svg"
import VideoIcon from "../svg/video.svg"
import AudioIcon from "../svg/audio.svg"
import { translate } from 'utils/functions'
import { useSelector } from 'react-redux'
function LastMessageBody({message,status}) {
    const language=useSelector((state)=>state.homepage.language)
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
            {message.sender_user_id===getUser()?.id && getMessageStatusIcon(message.message_status)}
            <ImageIcon className='message-type-icon' ></ImageIcon> {translate('Image',language)}
            </>)
        }
        if(message.message_type.name==="VoiceMessage"){
            return(
                <>
                {message.sender_user_id===getUser()?.id && getMessageStatusIcon(message.message_status)}
                <AudioIcon className='message-type-icon' ></AudioIcon> {translate('Audio',language)}
                </>)
        }
        if(message.message_type.name==="VideoMessage"){
            return(
                <>
                {message.sender_user_id===getUser()?.id && getMessageStatusIcon(message.message_status)}
                <VideoIcon className='message-type-icon'></VideoIcon> {translate('Video',language)}
                </>)
        }
        if(message.message_type.name==="FileMessage"){
            return(
                <>
                {message.sender_user_id===getUser()?.id && getMessageStatusIcon(message.message_status)}
                 {translate('File',language)}
                </>) 
        }
        if(message.message_type.name==="VoiceCall"){
            return(
                <>
               
                 {translate('Voice Call',language)}
                </>) 
        }
        if(message.message_type.name==="VideoCall"){
            return(
                <>
               
                 {translate('Video Call',language)}
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