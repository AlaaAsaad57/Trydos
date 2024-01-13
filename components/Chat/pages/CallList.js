import React from 'react'
import { useSelector } from 'react-redux'
import { getMessageTime } from '../chatsFunctions'
import CallItem from 'components/Chat/components/CallItem'

function CallList() {
  const calls=useSelector((state)=>state.chat.calls)
  return (
    <div className='chat-list-items'>
      {calls.map((call)=>(
        <CallItem photo={call.from.photo_path} name={call.from.name} type={call.type} date={getMessageTime(call)}/>
      ))}
    </div>
  )
}

export default CallList