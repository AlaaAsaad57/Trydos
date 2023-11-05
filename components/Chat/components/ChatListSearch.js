import React from 'react'
import Mignifier from "../svg/Mignifier.svg"
import { useDispatch } from 'react-redux'
import { SearchContact } from '../../../redux/chat/actions';
function ChatListSearch(props) {
  let filterTimeout;
let dispatch=useDispatch()
const SearchContacts = query => {
  props.setSearch(query)
  clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    SearchContact(query)
  }, 500)
}
  return (
    <div className='chat-window-search-holder'>
        <input onChange={(e)=>SearchContacts(e.target.value)} placeholder='Search, Chat, Contact, Start New Chat '/>
        <Mignifier></Mignifier>
    </div>
  )
}

export default ChatListSearch