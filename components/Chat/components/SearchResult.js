import React from 'react'
import { getTwoLetters, getUser } from '../chatsFunctions';
import ProfilePicture from "../../../public/images/profileNo.png"
import { useDispatch, useSelector } from 'react-redux';

function SearchResult({key,photo,SenderName,isUser,handleClickChat,item}) {
    const dispatch=useDispatch()
    const chats=useSelector((state)=>state.chat.data)
    const handleClick=()=>{
      if(isUser){
            
            setTimeout(() => {
                   handleClickChat({channel_members:[{user_id:item.id,user:item},{user_id:getUser().id,user:getUser()}],messages:[],id:null,mid:parseInt(Math.random()*1000)})
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