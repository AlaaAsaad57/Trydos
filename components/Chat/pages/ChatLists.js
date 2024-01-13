import React from 'react'
import ChatItem from 'components/Chat/components/ChatItem'
import { isNew } from 'components/Chat/chatsFunctions'
import { useDispatch, useSelector } from 'react-redux'
import { forwardMessage } from '../chatsFunctions'
import SearchResult from 'components/Chat/components/SearchResult'
import { getUserChat } from 'utils/functions'
import { EventTrack } from 'store/homepage/actions'

function ChatLists(props) {
  const chats=useSelector((state)=>state.chat.data)
  const pinned=useSelector((state)=>state.chat.pinnedChats)
  const searchResults=useSelector((state)=>state.chat.searchResults)
  const activeChat=useSelector((state)=>state.chat.activeChat)
  const forwarded_message=useSelector((state)=>state.chat.forwarded_message)
  const dispatch=useDispatch()
const handleClick=(e)=>{
  EventTrack('chat-opened',{chat_id:e.id})
            dispatch({ type: "OPEN-CHAT", payload: e })
           if(e?.id&&!(typeof e?.id ==="string"&&e.id.includes('ch'))) dispatch({ type: "WATCH_CHANNEL", payload: e?.id })
            if(forwarded_message){
              forwardMessage(forwarded_message,e)
            }
}
  return (
    <div className='chat-list-items'>
     {props.search.length===0? <>
     {
      chats?.filter((s)=>s.channel_members.filter((mem)=>mem.user_id===getUserChat()?.id)[0]?.pin===1).map((chat,key)=>{
        return(
          <ChatItem key={key} myKey={key} isActive={activeChat?.id===chat.id} handleClickChat={()=>handleClick(chat)} status={chat.status} unread={(chat.messages)} newMessage={isNew(chat.messages)} pinned={true} muted={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.mute)===1} SenderName={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.name} photo={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.photo_path} lastMessage={chat.messages[chat.messages.length-1]} id={chat.id} chat={chat}/>
      )})
     }
      {chats?.filter((s)=>s.channel_members.filter((mem)=>mem.user_id===getUserChat()?.id)[0]?.pin===0&&pinned.filter((p)=>p.id===s.id).length===0).map((chat,key)=>{
        return(
          <ChatItem key={key} myKey={key}  isActive={activeChat?.id===chat.id} handleClickChat={()=>handleClick(chat)} status={chat.status} unread={(chat.messages)} newMessage={isNew(chat.messages)} pinned={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.pin)===1} muted={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.mute)===1} SenderName={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.name} photo={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.photo_path} lastMessage={chat.messages[chat.messages.length-1]} id={chat.id} chat={chat}/>
      )})}
      
      </>
    :<>
        {chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id!==getUserChat()?.id && mem.user?.name?.toLowerCase()?.includes(props.search.toLowerCase())).length>0).map((chat,key)=>{
        return(
          <ChatItem key={key} myKey={key}  isActive={activeChat?.id===chat.id} handleClickChat={()=>handleClick(chat)} status={chat.status} unread={chat.unread} newMessage={isNew(chat.messages)} pinned={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.pin)===1} muted={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.mute)===1} SenderName={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.name} photo={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.photo_path} lastMessage={chat.messages[chat.messages.length-1]} id={chat.id} chat={chat}/>
      )})}
       {/* {chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id!==getUserChat()?.id && mem?.user?.name.toLowerCase()?.includes(props.search.toLowerCase())).length>0).map((chat)=>{
        return(
          <ChatItem isActive={activeChat?.id===chat.id} handleClickChat={()=>handleClick(chat)} status={chat.status} unread={chat.unread} newMessage={isNew(chat.messages)} pinned={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)?.pin)===1} muted={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)?.pin)===1} SenderName={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.name||chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.mobile_phone||'UnKnown User'} photo={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.photo_path} lastMessage={chat.messages[chat.messages.length-1]} id={chat.id} chat={chat}/>
      )})} */}
        {searchResults.filter((mem)=>mem.name.toLowerCase().includes(props.search.toLowerCase())).map((item,key)=>{
          if((chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id===item.id).length>0).length>0)||(chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id===item.id).length>0).length>0)){
            return <></>
          }
          else return(
          <SearchResult key={key} myKey={key}  item={item} handleClickChat={(e)=>handleClick(e)} SenderName={item.name} isUser={Boolean(item.contact_user_id)}/>)
        }
        )}
      </>  
    }
      
    </div> 
  )
}

export default ChatLists