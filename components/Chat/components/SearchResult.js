import React from 'react'
import { getTwoLetters, getUser } from '../chatsFunctions';
import ProfilePicture from "public/images/profileNo.png"
import { useDispatch, useSelector } from 'react-redux';

function SearchResult({key,photo,SenderName,isUser,handleClickChat,item}) {
    const dispatch=useDispatch()
    const chats=useSelector((state)=>state.chat.data)
    const handleClick=()=>{
      if(isUser){
            
            setTimeout(() => {
                   handleClickChat({channel_members:[{user_id:item.contact_user_id,user:item,mute:0,pin:0,archived:0},{mute:0,pin:0,archived:0,user_id:getUser()?.id,user:getUser()}],messages:[],id:"ch-"+item.contact_user_id,mid:"ch-"+item.contact_user_id})
                    dispatch({ type: "MAIN", payload: "chat" })        
            }, 500);}
            else{

            }
        
    }
  return (
    <div>
          <div className='chat-conversation-item-container' key={key}>
          {!isUser&&<div className='chat-activated-options' style={{color:"#388cff",fontSize:"16px",bottom:"22px",cursor:"pointer"}}>
            Invite
          </div>}
          <div className={`chat-conversation-item `} onClick={()=>handleClick()}>
          {photo?
            <img  onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src=ProfilePicture;
        }} alt='' src={process.env.REACT_APP_BASE_FILE_URL + photo }/>:
          <div className='text-avatar'>
          {getTwoLetters(SenderName)}
          </div>}
          <div className='chat-info'>
              <div className='chat-name'>
              {SenderName}
              </div>
        
          </div>
        
       </div>
      
    </div>
    </div>
  )
}

export default SearchResult