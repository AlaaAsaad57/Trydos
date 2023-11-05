import React from 'react'
import CallComponent from "./components/CallComponent"
import Chat from "./index"
import { useDispatch, useSelector } from 'react-redux'
import { ChatConroller } from '../../redux/chat/actions'
function ChatModal() {
    const isCallIncoming = useSelector(state => state.chat.isCallIncoming)
    const chatVar = useSelector(state => state.chat.chatVar)
    const dispatch = useDispatch()
  return (
    <>
          {isCallIncoming && <CallComponent reply={() => dispatch(ChatConroller(true))} />}
          {chatVar&& <Chat open={chatVar} close={() => dispatch(ChatConroller(false))} callIn />} 
    </>
  )
}

export default ChatModal