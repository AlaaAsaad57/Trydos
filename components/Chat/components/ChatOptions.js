import React from 'react'
import UnreadIcon from '../svg/UnreadIcon.svg'
import PinIcon from '../svg/PinIcon.svg'
import MuteIcon from '../svg/muteIcon.svg'
import UnmuteIcon from '../svg/UnmuteIcon.svg'
import DeleteIcon from '../svg/DeleteIcon.svg'
import ArchiveIcon from '../svg/ArchiveIcon.svg'
import { useDispatch, useSelector } from 'react-redux'
import { translate } from 'utils/functions'
function ChatOptions({id,unread,pinned,muted}) {
    const dispatch=useDispatch()
    const language=useSelector((state)=>state.homepage.language)
  return (
    <div className='chat-options-container'>
    <div className='chat-option chat-1' onClick={()=>dispatch({type:"UNREAD_CHAT_REDUCER",payload:{id:id,value:!unread}})}>
    <UnreadIcon></UnreadIcon>
    <div>{unread?translate('Read',language):translate('Unread',language)}</div>
    </div>
    <div className='chat-option chat-2' onClick={()=>dispatch({type:"PIN_CHAT_REDUCER",payload:{id:id,value:!pinned}})}>
    <PinIcon ></PinIcon>
    <div>{pinned?translate("Unpin",language):translate('Pin',language)}</div>
    </div>
    <div className='chat-option chat-3' onClick={()=>dispatch({type:"MUTE_CHAT_REDUCER",payload:{id:id,value:!muted}})}>
      {!muted?<MuteIcon></MuteIcon>:<UnmuteIcon></UnmuteIcon>}
    <div>{muted?translate("Unmute",language):translate('Mute',language)}</div>
    </div>
    <div className='chat-option chat-4' onClick={()=>dispatch({type:"DELETE_CHAT_REDUCER",payload:{id:id}})}>
    <DeleteIcon></DeleteIcon>
    <div>{translate("Delete",language)}</div>
    </div>
    <div className='chat-option chat-5'>
    <ArchiveIcon></ArchiveIcon>
    <div>{translate("Archive",language)}</div>
    </div>
</div>
  )
}

export default ChatOptions