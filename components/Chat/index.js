import React, { useEffect } from 'react'
import "./index.css"
import ChatWindow from './pages/ChatWindow'
import { useDispatch, useSelector } from 'react-redux'
import ConversationContainer from './pages/ConversationContainer'
import NewChatsSide from './components/NewChatsSide'
import { useState } from 'react'
import { SSRDetect } from '../../utils/functions'
function ChatContainer(props) {
  const dispatch=useDispatch()
  const ViewedScreen=useSelector((state)=>state.chat.main)
  const first=useSelector((state)=>state.chat.first)
  const chats=useSelector((state)=>state.chat.data)
  const loading=useSelector((state)=>state.chat.fetch);
  const activeChat=useSelector((state)=>state.chat.activeChat)
  const forwarded_message=useSelector((state)=>state.chat.forwarded_message)
  const [search,setSearch]=useState("")
  const [contactOpen,setOpenContacts]=useState(false)
  return (
    <>
    <div onClick={(e) => {
        if(!props.callInProgress){        
          dispatch({type:"FORWARD-MESSAGEs",payload:null})
        props.close();
        dispatch({type:"MAIN",payload:'main'})
         dispatch({type:"OPEN-CHAT",payload:null})}}} className={`lang-modalDisable ${props.open && "open"}`}></div>
            <div className='app' style={{position:"fixed",top:"105px",right:"30px"}}><textarea id="text-copy"></textarea>
      <ChatWindow open={contactOpen} setOpenContacts={(e)=>setOpenContacts(e)} search={search} setSearch={(e)=>setSearch(e)} activeChat={activeChat} ViewedScreen={ViewedScreen} />
     {SSRDetect()&& <ConversationContainer first={first}  loading={loading} active={activeChat}   ViewedScreen={(ViewedScreen==="chat"&&!contactOpen)}/>}
      <NewChatsSide activeChat={activeChat} chats={chats}/>
    </div>
    </>

  )
}

export default ChatContainer