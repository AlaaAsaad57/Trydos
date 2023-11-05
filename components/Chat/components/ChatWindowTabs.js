import React from 'react'
import ChatTabIcon from './ChatTabIcon'
import ChatIcon from "../svg/Tabs/ChatIcon.svg"
import ActiveChatIcon from "../svg/Tabs/ActiveChatIcon.svg"
import HasNewChatIon from "../svg/Tabs/HasNewChatIon.svg"
import CallIcon from "../svg/Tabs/CallIcon.svg"
import ActiveCallIcon from "../svg/Tabs/ActiveCallIcon.svg"
import HasNewCallIcon from "../svg/Tabs/HasNewCallIcon.svg"
import StoryIcon from "../svg/Tabs/StoryIcon.svg"
import ActiveStoryIcon from "../svg/Tabs/ActiveStoryIcon.svg"
import { getNew } from '../chatsFunctions'
import { useSelector } from 'react-redux'
function ChatWindowTabs({SelectedTab,setSelectedTab}) {
  const chats=useSelector((state)=>state.chat.data)
  return (
    <div className='chat-tabs-container'>
        <div className='chat-tab' onClick={()=>setSelectedTab("Chats")}>
            <ChatTabIcon index={1} SelectedTab={SelectedTab==="Chats"} setSelectedTab={setSelectedTab} Icon={ChatIcon} ActiveIcon={ActiveChatIcon} HasNewItemIcon={HasNewChatIon} NumberOfItems={getNew(chats,{id:"false"}).length}/>
        </div>
        <div className='chat-tab' onClick={()=>setSelectedTab("Calls")}>
        
            <ChatTabIcon  index={2}  SelectedTab={SelectedTab==="Calls"} setSelectedTab={setSelectedTab} Icon={CallIcon} ActiveIcon={ActiveCallIcon} HasNewItemIcon={HasNewCallIcon} NumberOfItems={9}/>
     
        </div>
        <div className='chat-tab' onClick={()=>setSelectedTab("Stories")}>
            <ChatTabIcon  index={3} SelectedTab={SelectedTab==="Stories"} setSelectedTab={setSelectedTab} Icon={StoryIcon} ActiveIcon={ActiveStoryIcon} HasNewItemIcon={StoryIcon} NumverOfItems={9}/>
        </div>
    </div>
  )
}

export default ChatWindowTabs