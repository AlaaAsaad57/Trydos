import React from 'react'
import Mignifier from "../svg/Mignifier.svg"
import { useDispatch, useSelector } from 'react-redux'
import { SearchContact } from 'store/chat/actions';
import { translate } from 'utils/functions';
function ChatListSearch(props) {
  let filterTimeout;
let dispatch=useDispatch()
const SearchContacts = query => {
  EventTrack('chat-search',{chat_id:query})
  props.setSearch(query)
  clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    SearchContact(query)
  }, 500)
}
const language=useSelector((state)=>state.homepage.language)

  return (
    <div className='chat-window-search-holder' aria-label={language}>
        <input onChange={(e)=>SearchContacts(e.target.value)} placeholder={translate('Search, Chat, Contact, Start New Chat',language)}/>
        <Mignifier></Mignifier>
    </div>
  )
}

export default ChatListSearch