import React,{useEffect} from 'react'
import ProfilePicture from "public/images/profileNo.png"
import LastMessageBody from './LastMessageBody'
import TypingIndicator from './TypingIndicator'
import { getMessageTime, getTwoLetters } from '../chatsFunctions'
import MessageIcon from "../svg/messageIcon.svg"
import ArrowRightIcon from "../svg/arrowRight.svg"
import MutedChatIcon from "../svg/MutedChat.svg"
import PinnedChatIcon from "../svg/PinnedChat.svg"
import ChatOptions from './ChatOptions'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
import Image from 'next/image'
function ChatItem({isActive,unread,handleClickChat,SenderName,photo,lastMessage,id,status,newMessage,pinned,muted}) {
    const [Moving,setMoving]=useState(false)
    var timeout
  function handleTouchStart(evt, a, index) {
    
    isMove = null
    a.style.transform = `translateX(-${Math.abs(0)}px)`
    a.addEventListener('touchmove', (e) => handleTouchMove(e, a, index), { once: true,passive:true });
    a.addEventListener('mousemove', (e) => handleTouchMove(e, a, index), { once: true });
    setMoving(null)
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;

};

var xDown = null;
var yDown = null;
var isMove = null;
var moving = false
function handleTouchEnd(e, a, index) {
    a.removeEventListener('touchmove', (e) => handleTouchMove);
    a.removeEventListener('mousemove', (e) => handleTouchMove);

    xDown = null;
    yDown = null;
}
useEffect(() => {
  
    document.querySelectorAll(".chat-conversation-item").forEach((a, index) => {
        a.addEventListener('touchstart', (e) => handleTouchStart(e, a, index), {passive: true});
        a.addEventListener('touchend', (e) => handleTouchEnd(e, a, index), false);
        a.addEventListener('mousedown', (e) => handleTouchStart(e, a, index), false);
        a.addEventListener('mouseup', (e) => handleTouchEnd(e, a, index), false);
    })
}, [])
function getTouches(evt) {
    return evt.touches ||             // browser API
        [evt]; // jQuery
}
function handleTouchMove(evt, a, indexx) {


    evt.preventDefault()
    if (!xDown || !yDown) {
        return;
    }
    document.querySelectorAll(".chat-conversation-item").forEach((v, index) => {
        if (indexx !== index) {
            v.style.transform = "translateX(0px)"
            setMoving(false)
        }
    })
    setMoving(id)
    a.previousElementSibling.style.display='none'

    isMove = true
    var yUp, xUp
    if (evt.touches) {
        xUp = evt.touches[0]?.clientX;
        yUp = evt.touches[0]?.clientY;
    }
    else {
        xUp = evt.clientX;
        yUp = evt.clientY;
    }

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
        if (xDiff > 0) {
            if (Math.abs(xDiff) < 250) {
                dispatch({type:"MAIN",payload:"main"})
                dispatch({type:"OPEN-CHAT",payload:null})
                moving = true
                a.style.transform = `translateX(-${Math.abs(250)}px)`
                if(timeout){
                    clearTimeout(timeout)
                }
            }
        } else {
            if (Math.abs(xDiff) < 180) {
                
                moving = true
                a.style.transform = `translateX(${Math.abs(180)}px)`
                if(timeout){
                    clearTimeout(timeout)
                }
            }


        }
    } else {
        if (yDiff > 0) {
            /* down swipe */
        } else {
            /* up swipe */
        }
    }
    /* reset values */

};
useEffect(() => {
    document.querySelectorAll(".chat-option").forEach((a) => {
        a.addEventListener("click", function () {
            setTimeout(() => {
                document.querySelectorAll(".chat-conversation-item").forEach((v, index) => {
                    setMoving(false)
                    v.previousElementSibling.style.display='flex'
                    v.style.transform = "translateX(0px)"

                })
            }, 700);
        })
    })
}, [])
const dispatch=useDispatch()

const handleClick=()=>{
   timeout= setTimeout(() => {
        if (!isMove && Moving!==id) {
           handleClickChat()
            xDown = null
            yDown = null
            moving = false
            setMoving(false)
            dispatch({ type: "MAIN", payload: "chat" })
        }
        else {
            if (!isMove&&Moving===id) {
                ;
            }
        }

    }, 800);
}
  return (
    <div className='chat-conversation-item-container'>
      <div className={'chat-activated-options'}>
        {newMessage===0&&muted&&<MutedChatIcon/>}
        {newMessage===0&&pinned&&<PinnedChatIcon/>}
      </div>
          <div className={`chat-conversation-item ${status&&status!=='null'&&'typing'} ${isActive && 'active-chat-effect'}`} onMouseUp={()=>handleClick()}>
          {photo&&(!(photo?.includes('eu')))?
            <Image priority={false} width={60} height={60} alt='user' loading='eager'  src={ photo }/>:
         SenderName? <div className='text-avatar'>
          {getTwoLetters(SenderName)}
          </div>
          :<Image alt="Picture of the author" priority={false} src={ProfilePicture} width={60} height={60}/>
          }
          <div className='chat-info'>
              <div className='chat-name'>
              {SenderName||'User-'+id}
              </div>
              {lastMessage&&(!status||status==='null')&&<LastMessageBody status={status} message={lastMessage}/>}
              {status&&status!=='null'&&<TypingIndicator/>}
          </div>
        {lastMessage&&  <div className='chat-date'>
                <div className='date-clock'>{getMessageTime(lastMessage)}</div>
                {/* <div className='date-clock'>{props.chat.messages[props.chat.messages.length-1].sent}</div> */}
          
            </div>}
            <div className='arrow-right'><ArrowRightIcon/></div>
            {newMessage > 0 && <div className='chat-new'>
                <MessageIcon/>
                <div className='new-mes'>{newMessage}</div>
            </div>}
       </div>
       <ChatOptions
        unread={unread}
        muted={muted}
         pinned={pinned}
          id={id}/>
    </div>

  )
}

export default ChatItem