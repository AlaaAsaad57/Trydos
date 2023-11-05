import React from 'react'
import "./styles.css"
import UserInfoHeader from './UserInfoHeader'
import ChatListSearch from './ChatListSearch'
function ChatWindowHeader(props) {
  return (
    <div className="chat-window-header">
        <UserInfoHeader/>
        <ChatListSearch search={props.search} setSearch={(e)=>props.setSearch(e)}/>
        
    </div>
  )
}

export default ChatWindowHeader