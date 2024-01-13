import React from 'react'
import ChatItem from 'components/Chat/components/ChatItem'
import { useDispatch, useSelector } from 'react-redux'
import { forwardMessage } from '../chatsFunctions'
import SearchResult from 'components/Chat/components/SearchResult'
import { getUserChat } from 'utils/functions'

function ContactLists(props) {
  const chats=useSelector((state)=>state.chat.data)
  const contacts=useSelector((state)=>state.chat.contacts)
  const forwarded_message=useSelector((state)=>state.chat.forwarded_message)
  const dispatch=useDispatch()
const handleClick=(e)=>{
            dispatch({ type: "OPEN-CHAT", payload: e })
           if(e?.id) dispatch({ type: "WATCH_CHANNEL", payload: e?.id })
            if(forwarded_message){
              forwardMessage(forwarded_message,e)
            }
}
  return (
    <div className='chat-list-items'>
        {
        <>
        {
            contacts.filter((contact)=>{if(props.search.length===0) return true ; else return (contact.name.toLowerCase().includes(props.search.toLowerCase())||contact.mobile_phone.toLowerCase().includes(props.search.toLowerCase()))}).map((contact,key)=>{
                if(chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0).length>0){
                    return(
                        <ChatItem myKey={key} key={key} isActive={false} handleClickChat={()=>{
                            props.close()
                            handleClick(chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0)[0]);}} status={chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0)[0]?.status} unread={chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0)[0]?.unread} newMessage={0} pinned={false} muted={false} SenderName={chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0)[0]?.channel_members.filter((member)=>parseInt(member?.user_id)!==parseInt(getUserChat()?.id))[0]?.user?.name||chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0)[0]?.channel_members.filter((member)=>parseInt(member?.user_id)!==parseInt(getUserChat()?.id))[0]?.user?.mobile_phone||'User'} photo={chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0)[0]?.channel_members.filter((member)=>parseInt(member?.user_id)!==getUserChat()?.id)[0]?.user?.photo_path} lastMessage={null} id={chats.filter((chat)=>chat.channel_members.filter((mem)=>parseInt(mem.user_id)===parseInt(contact?.contact_user?.id)).length>0)[0]?.id} chat={chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id===contact?.contact_user?.id).length>0)[0]}/>
                    )
                }
                else{
                    return(
                        <SearchResult myKey={key} key={key} item={contact} handleClickChat={(e)=>{
                            props.close()
                            handleClick(e);}} SenderName={contact.name||contact.mobile_phone} isUser={Boolean(contact.contact_user_id)}/>
                    )
                }
            })
        }
        </>
      }
     {/* {props.search.length===0? <>
    
        {contacts.filter((mem)=>mem?.name?.toLowerCase().includes(props.search.toLowerCase())).map((item)=>{
          if((chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id===item.id).length>0).length>0)||(chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id===item.id).length>0).length>0)){
            return <>
             <ChatItem isActive={activeChat?.id===chat.id} handleClickChat={()=>handleClick(chat)} status={chat.status} unread={chat.unread} newMessage={isNew(chat.messages)} pinned={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.pin)===1} muted={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.mute)===1} SenderName={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.name||chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.username||'UnKnown User'} photo={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.photo_path} lastMessage={chat.messages[chat.messages.length-1]} id={chat.id} chat={chat}/>

            </>
          }
          else return(
          <SearchResult item={item} handleClickChat={(e)=>handleClick(e)} SenderName={item.name} isUser={Boolean(item.contact_user_id)}/>)
        }
        )}
      </>
    :<>
        {chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id!==getUserChat()?.id && mem.user?.name?.toLowerCase()?.includes(props.search.toLowerCase())).length>0).map((chat)=>{
        return(
          <ChatItem isActive={activeChat?.id===chat.id} handleClickChat={()=>handleClick(chat)} status={chat.status} unread={chat.unread} newMessage={isNew(chat.messages)} pinned={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.pin)===1} muted={parseInt(chat.channel_members.filter((s)=>s.user_id===getUserChat()?.id)[0]?.mute)===1} SenderName={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.name||chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.username||'UnKnown User'} photo={chat?.channel_members.filter((member)=>member?.user_id!==getUserChat()?.id)[0]?.user?.photo_path} lastMessage={chat.messages[chat.messages.length-1]} id={chat.id} chat={chat}/>
      )})}
        {searchResults.filter((mem)=>mem.name.toLowerCase().includes(props.search.toLowerCase())).map((item)=>{
          if((chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id===item.id).length>0).length>0)||(chats.filter((chat)=>chat.channel_members.filter((mem)=>mem.user_id===item.id).length>0).length>0)){
            return <></>
          }
          else return(
          <SearchResult item={item} handleClickChat={(e)=>handleClick(e)} SenderName={item.name} isUser={Boolean(item.contact_user_id)}/>)
        }
        )}
      </>  
    } */}
      
    </div> 
  )
}

export default ContactLists