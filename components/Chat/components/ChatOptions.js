import React from 'react'
import UnreadIcon from '../svg/UnreadIcon.svg'
import PinIcon from '../svg/PinIcon.svg'
import MuteIcon from '../svg/muteIcon.svg'
import UnmuteIcon from '../svg/UnmuteIcon.svg'
import DeleteIcon from '../svg/DeleteIcon.svg'
import ArchiveIcon from '../svg/ArchiveIcon.svg'
import { useDispatch } from 'react-redux'
function ChatOptions({id,unread,pinned,muted}) {
    const dispatch=useDispatch()
  return (
    <div className='chat-options-container'>
    <div className='chat-option chat-1' onClick={()=>dispatch({type:"UNREAD_CHAT_REDUCER",payload:{id:id,value:!unread}})}>
    <UnreadIcon></UnreadIcon>
    <div>{unread?'Read':'Unread'}</div>
    </div>
    <div className='chat-option chat-2' onClick={()=>dispatch({type:"PIN_CHAT_REDUCER",payload:{id:id,value:!pinned}})}>
    <PinIcon ></PinIcon>
    <div>{pinned?"Unpin":'Pin'}</div>
    </div>
    <div className='chat-option chat-3' onClick={()=>dispatch({type:"MUTE_CHAT_REDUCER",payload:{id:id,value:!muted}})}>
      {!muted?<MuteIcon></MuteIcon>:<UnmuteIcon></UnmuteIcon>}
    <div>{muted?"Unmute":'Mute'}</div>
    </div>
    <div className='chat-option chat-4' onClick={()=>dispatch({type:"DELETE_CHAT_REDUCER",payload:{id:id}})}>
    <DeleteIcon></DeleteIcon>
    <div>Delete</div>
    </div>
    <div className='chat-option chat-5'>
    <ArchiveIcon></ArchiveIcon>
    <div>Archive</div>
    </div>
</div>
  )
}

export default ChatOptions