import React, { useEffect, useRef, useState } from "react";
import SendIcon from "../svg/sent.svg";
import ReadIcon from "../svg/read.svg";
import ReceiveIcon from "../svg/recieved.svg";
import WaveIcon from "../svg/wave.svg";
import PlayIcon from "../svg/play.svg";
import PauseIcon from "../svg/pause.svg";
import RecordIcon from "../svg/record.svg";
import RedRecord from "../svg/recordme.svg";
import ForwardIcon from "../svg/forwarded.svg";
import MissedIcon from "../svg/misscall.svg";
import VideoIconMissed from "../svg/VideoMissed.svg";
import profile from "public/images/profileNo.png"
import { useDispatch, useSelector } from "react-redux";
import OptionsMenu from "./OptionsMenu";
import { getTwoLetters, getUser } from "../chatsFunctions";
import RepliedMessage from "./RepliedMessage";
import SpinIcon from '../svg/spinn.svg'
import DownIcon from '../svg/down.svg'
import fil from '../svg/output.png'

import Spinner from "../../global/Spinner";
import { SSRDetect, getUserChat, translate } from "utils/functions";
import Image from "next/image";
function ChatMessage(props) {
  const {setImg,setVid}=props
  const message_ref=useRef()
  const [width, setWidth] = useState(0);
  const [opens, setOpen] = React.useState(false);
  const language=useSelector((state)=>state.homepage.language)
  const refmessage = useRef()
  const AudioRef = useRef()
  const activeChat = useSelector((state) => state.chat.activeChat)
  const [playing, setPlay] = useState(false)
  const getTimeInlocalTimeZone = (d) => {

    let m = new Date();
    if (d.getHours() === m.getHours()) {
      return d
    }
    else {
      const myDate = new Date()
      let a = new Date(d.getTime() - (myDate.getTimezoneOffset() * 60 * 1000));
      return a;
    }
  };
  const dispatch = useDispatch()
  const getStatues = () => {
    let a = props.message.message_status.filter((a) => a.user_id !== (getUserChat()?.id))
    if (a.length > 0) {
      return (a[0])

    }
    else {
      return ({ is_watched: false, is_received: 0 })
    }
  }
  const getMessageStatus = () => {
    if(props.message.mid){
     return( <>
      {<div className='sent-date'>
        {<>
          <svg fill="#3C3C3C" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
	 width="800px" height="800px" viewBox="0 0 473.068 473.068"
	 xmlSpace="preserve">
<g>
	<g id="Layer_2_31_">
		<g>
			<path d="M355.507,181.955c8.793-6.139,29.39-20.519,29.39-55.351v-71.77h9.814c4.49,0,8.17-3.679,8.17-8.169v-38.5
				c0-4.49-3.681-8.165-8.17-8.165H78.351c-4.495,0-8.165,3.675-8.165,8.165v38.5c0,4.491,3.67,8.169,8.165,8.169h9.82v73.071
				c0,34.499,10.502,42.576,29.074,53.89l80.745,49.203v20.984c-20.346,12.23-73.465,44.242-80.434,49.107
				c-8.793,6.135-29.384,20.51-29.384,55.352v61.793h-9.82c-4.495,0-8.165,3.676-8.165,8.166v38.498c0,4.49,3.67,8.17,8.165,8.17
				h316.361c4.49,0,8.17-3.68,8.17-8.17V426.4c0-4.49-3.681-8.166-8.17-8.166h-9.814v-63.104c0-34.493-10.508-42.572-29.069-53.885
				l-80.745-49.202v-20.987C295.417,218.831,348.537,186.822,355.507,181.955z M252.726,272.859l87.802,53.5
				c6.734,4.109,10.333,6.373,12.001,9.002c1.991,3.164,2.963,9.627,2.963,19.768v63.104H117.574v-61.793
				c0-19.507,9.718-26.289,16.81-31.242c5.551-3.865,54.402-33.389,85.878-52.289c4.428-2.658,7.135-7.441,7.135-12.611v-37.563
				c0-5.123-2.671-9.883-7.053-12.55l-87.54-53.339l-0.265-0.165c-6.741-4.105-10.336-6.369-11.998-9.009
				c-1.992-3.156-2.968-9.626-2.968-19.767V54.835h237.918v71.77c0,19.5-9.718,26.288-16.814,31.235
				c-5.546,3.872-54.391,33.395-85.869,52.295c-4.427,2.658-7.134,7.442-7.134,12.601v37.563
				C245.675,265.431,248.346,270.188,252.726,272.859z"/>
			<path d="M331.065,154.234c0,0,5.291-4.619-2.801-3.299c-19.178,3.115-53.079,15.133-92.079,15.133s-57-11-82.507-11.303
				c-5.569-0.066-5.456,3.629,0.937,7.391c6.386,3.758,63.772,35.681,71.671,40.08c7.896,4.389,12.417,4.05,20.786,0
				C259.246,196.334,331.065,154.234,331.065,154.234z"/>
			<path d="M154.311,397.564c-6.748,6.209-9.978,10.713,5.536,10.713c12.656,0,139.332,0,155.442,0
				c16.099,0,9.856-5.453,2.311-12.643c-14.576-13.883-45.416-23.566-82.414-23.566
				C196.432,372.068,169.342,383.723,154.311,397.564z"/>
		</g>
	</g>
</g>
</svg>
        {getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.watched_at,false)}</>}</div>}


    </>)
    }
    if (props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id)).length > 0 && props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.is_watched === true&&props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.watched_at) {
      return (
        <>
          {<div className='sent-date'>
            {<><ReadIcon></ReadIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}


        </>
      )
    }
    else if (props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id)).length > 0 && props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.is_received === 1&&props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.received_at) {
      return (
        <>
          {<div className='sent-date'>
            {<><ReceiveIcon></ReceiveIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}


        </>
      )
    }
    else {
      return (
        <>
          {<div className='sent-date'>
            {<><SendIcon></SendIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}


        </>
      )
    }
  }
  useEffect(()=>{
    if(props.message.id===915){
     ; }
  },[])
  const getMessageTime = (ti,zone) => {
    let d
    if (ti) {
      if(zone){
        d = new Date(new Date(ti))
        return `${d.getHours() > 9 ? d.getHours() : "0" + d.getHours()}:${d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes()}`;
      }
      else{
        d = new Date(new Date(ti).getTime()+(3*60*60*1000))
        return `${d.getHours() > 9 ? d.getHours() : "0" + d.getHours()}:${d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes()}`;
      }
     
    }
    else {
      d = new Date();
      return `${d.getHours() > 9 ? d.getHours() : "0" + d.getHours()}:${d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes()}`;
    }
  };
  useEffect(() => {
    if (AudioRef.current && AudioRef.current.ended) {
      setPlay(false);
      AudioRef.current.currentTime = 0;
    }
  }, [AudioRef]);
  const showTime = (m) => {
    if(!m){
      return null
    }
    let minutes = Math.round(m / 60);
    let seconds = Math.round(m - minutes * 60);
    return `${minutes > 9 ? minutes : "0" + minutes}:${seconds > 9 ? seconds : "0" + seconds
      }`;
  };
  const showBord = (type, height) => {
    let arr = [];
    let num = height / 7;
    if (type === "middle-chat") {
      num = (height + 10) / 7;
    }
    for (var i = 0; i < num; i++) {
      arr.push("");
    }
    return arr
  }
  const animate=(value)=>{
    SSRDetect()&&
    window.requestAnimationFrame(step)
  }
function step(){
  let el=document.querySelector(`#wav${(props.message.id||props.message.mid)}`)
  el.style.marginLeft=`${width}px`

}
const copyText=()=>{
  let elem = document.querySelector("#text-copy");
  elem.value = props.message?.message_content?.content
  elem.select()
  document.execCommand('Copy');
}
  const showMessage = () => {
   
    if (parseInt(props.message.sender_user_id) === parseInt(getUserChat()?.id)) {
      if (props.message.message_type.name === "ImageMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
             {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)}  message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
     
            <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body message-img-body ' + props.type + ' ' + ` ${opens && "ac"}`}>
            {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
              <div className='border-element'>
                {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
                  <div className='border-child' key={i}></div>
                ))}
              </div>
              {props.type === "first-chat" && <div className='bordse'></div>}

              {(props.type === "first-chat" || props.type === "lonely") &&
                <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                  {activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                  activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   <Image alt="user-img" src={profile} width={30} height={30}/>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?
                      <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                    : <Image alt="user-img" src={profile} width={30} height={30}/>
                    }

                </div>}
              <img  onClick={() => setImg((props.message.type || props.message.message_content[0]?.file_path.includes("https")) ? (
                props.message.message_content[0]?.file_path) : (
                props.message.message_content[0]?.file_path))} className='message-img' src={props.message.message_content ? (
                props.message.type ? (
                  props.message.message_content[0]?.file_path) : (
                    props.message.message_content[0]?.file_path)) : "null"} />
              
              <div className="message-date">
                {getMessageStatus()}
              </div>
            </div>
            <div className='message-date hovers'>
                {<div className='sent-date'>{<><SendIcon></SendIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}
                {getStatues().is_received === 1 && <div className='recieve-date'><ReceiveIcon></ReceiveIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.received_at,false)}</div>}
                {getStatues().is_watched === true && <div className='recieve-date'><ReadIcon></ReadIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.watched_at,false)}</div>}
                
              </div>
              
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />
          </div>
        )
      }
     if (props.message.message_type.name === "VideoMessage") { 
   
       return( <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
        {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}

       <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body message-img-body ' + props.type + ' ' + ` ${opens && "ac"}`}>
       {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
         <div className='border-element'>
           {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
         </div>
         {props.type === "first-chat" && <div className='bordse'></div>}

         {(props.type === "first-chat" || props.type === "lonely") &&
                   <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                   {activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                   activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name?
                    <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                    :
                    <Image alt="user-img" src={profile} width={30} height={30}/>
                    :
                    activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.name?
                    <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                    :
                    activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?
                       <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                     : <Image alt="user-img" src={profile} width={30} height={30}/>
                     }
 
                 </div>}
                <PlayIcon
                  onClick={() => {
                    setVid((props.message.type || props.message.message_content[0]?.file_path.includes("https") || props.message.message_content[0]?.file_path.includes("http")) ? (
                      props.message.message_content[0]?.file_path) : (
                      props.message.message_content[0]?.file_path))
                  }}
                  className="play-vid-icon"
                  
                ></PlayIcon>
         <video className='message-img' src={props.message.message_content ? (
           props.message.type ? (
             props.message.message_content[0]?.file_path) : (
               props.message.message_content[0]?.file_path)) : "null"}>
              <source src={props.message.message_content ? (
           props.message.type ? (
             props.message.message_content[0]?.file_path) : (
               props.message.message_content[0]?.file_path)) : "null"}></source>
             </video>
         
         <div className="message-date">
           {getMessageStatus()}
         </div>
       </div>
       <div className='message-date hovers'>
           {<div className='sent-date'>{<><SendIcon></SendIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}
           {getStatues().is_received === 1 && <div className='recieve-date'><ReceiveIcon></ReceiveIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.received_at,false)}</div>}
           {getStatues().is_watched === true && <div className='recieve-date'><ReadIcon ></ReadIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.watched_at,false)}</div>}
         </div>
         
       <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />
     </div>)
      }
      if (props.message.message_type.name === "VoiceMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
             {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
            {props.message.message_content && props.message.message_content[0]?.file_path && props.message.message_content[0]?.file_path !== "false" &&
              <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body audio-body ' + props.type}>
                 {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
                <div className='border-element'>
                  {refmessage.current &&showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
                </div>
                <audio  onTimeUpdate={(e) => {
                  animate()
                  setWidth((parseFloat(e.target.currentTime) * 100) / parseFloat(AudioRef.current?.duration) * 1.8)
                  
                  }}  onEnded={() => { setPlay(false); setWidth(0); AudioRef.current.currentTime = 0; setWidth(0)}} controls={false} ref={AudioRef} src={props.message.type ? (props.message.message_content && props.message.message_content[0]?.file_path) : ( props.message.message_content[0]?.file_path)}>
                  <source src={props.message.type ? (props.message.message_content[0]?.file_path) : ( props.message.message_content && props.message.message_content[0]?.file_path)} />
                </audio>
                {(props.type === "first-chat" || props.type === "lonely") &&
                   <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                   {activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                   activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name?
                    <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                    :
                    <Image alt="user-img" src={profile} width={30} height={30}/>
                    :
                    activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.name?
                    <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                    :
                    activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?
                       <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                     : <Image alt="user-img" src={profile} width={30} height={30}/>
                     }
 
                 </div>}
                <div className='audio-message'>
                {AudioRef.current?.duration? 
                !AudioRef.current.paused?
                   <PauseIcon className='play-icon' onClick={() => { setPlay(!playing); if (playing) AudioRef.current.pause(); else AudioRef.current.play() }}></PauseIcon>:
                   <PlayIcon className='play-icon' onClick={() => { setPlay(!playing); if (playing) AudioRef.current.pause(); else AudioRef.current.play() }}></PlayIcon>
                   
                   :
              <Spinner className="play-icon"/>
              } <div className='player-cont'>
                    <div className='wave-absolute'>
                     {AudioRef.current?.duration!==Infinity&&AudioRef.current?.duration!==undefined&&AudioRef.current?.duration!==NaN&&showTime(AudioRef.current?.duration)!==null&&showTime(AudioRef.current?.duration)!==NaN&&showTime(AudioRef.current?.duration)!=='NaN'&&
                      <div className='player-time'>{AudioRef.current && AudioRef.current?.duration && showTime(AudioRef.current?.duration)}</div>}
                      <div className='wave' id={`wav${(props.message.id||props.message.mid)}`}><WaveIcon></WaveIcon></div>
                    </div>
                    <div className='player-line'></div>
                  </div>
                  <RedRecord  className="play-icon-me"></RedRecord>

                </div>
                
                <div className="message-date">
                  {getMessageStatus()}
                </div>
              </div>
              
              }
               <div className='message-date hovers'>
                {<div className='sent-date'>{<><SendIcon></SendIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}
                {getStatues().is_received === 1 && <div className='recieve-date'><ReceiveIcon></ReceiveIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.received_at,false)}</div>}
                {getStatues().is_watched === true && <div className='recieve-date'><ReadIcon></ReadIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.watched_at,false)}</div>}
              </div>
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />

             
          </div>
        )
      }
      if (props.message.message_type.name === "TextMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`} >
            {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
        
            <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body text-body ' + props.type } >
            {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
              <div className='border-element'>
                {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") &&
                  <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                  {activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                  activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   <Image alt="user-img" src={profile} width={30} height={30}/>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?
                      <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                    : <Image alt="user-img" src={profile} width={30} height={30}/>
                    }

                </div>}
              {props.message.message_content && props.message.message_content?.content}
             
              <div className="message-date">
                {getMessageStatus()}
              </div>
            </div>
            <div className='message-date hovers'>
                {<div className='sent-date'>{<><SendIcon></SendIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}
                {getStatues().is_received === 1 && <div className='recieve-date'><ReceiveIcon></ReceiveIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.received_at,false)}</div>}
                {getStatues().is_watched === true && <div className='recieve-date'><ReadIcon></ReadIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.watched_at,false)}</div>}
              </div>
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />
           
            
                </div>)
      }
      if (props.message.message_type.name === "FileMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`} >
            {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
        
             <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body text-body ' + props.type } >
            {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
              <div className='border-element'>
                {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") &&
                <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                {activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 <Image alt="user-img" src={profile} width={30} height={30}/>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?
                    <Image  alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                  : <Image alt="user-img" src={profile} width={30} height={30}/>
                  }

              </div>}
                {props.message?.message_content && props.message?.message_content[0]?.file_path && (
                <a
                  target="_blank"
                  href={(props.message.message_content[0]?.file_path.includes("https") || props.message.message_content[0]?.file_path.includes("http") || props.message.type) ? props.message.message_content[0]?.file_path :  props.message.message_content[0]?.file_path}
                  download
                  className="replay-msg file-msg"
                >
                  <Image alt="user-img" src={fil.src} width={26} height={20} style={{ width: "26px" }} />
                  <div className="file-desc">
                    <div className="file-name">
                      {"FILE"}
                    </div>
                    <div className="file-type">
                     
                    </div>
                  </div>
                  {props.message?.type ? (
                    <SpinIcon></SpinIcon>
                  ) : (
                    <DownIcon style={{minWidth:"34px"}}></DownIcon>
                  )}
                </a>
              )}
              <div className='message-date hovers'>
                {<div className='sent-date'>{<><SendIcon></SendIcon>{getMessageTime(props.message.created_at,true)}</>}</div>}
                {getStatues().is_received === 1 && <div className='recieve-date'><ReceiveIcon></ReceiveIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.received_at,false)}</div>}
                {getStatues().is_watched === true && <div className='recieve-date'><ReadIcon ></ReadIcon>{getMessageTime(props.message.message_status.filter((a) => a.user_id !== (localStorage.getItem("USER-CHAT") && getUserChat()?.id))[0]?.watched_at,false)}</div>}
              </div>
              <div className="message-date">
                {getMessageStatus()}
              </div>
            </div>
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />
           
           
                </div>
                )
      }
      if (props.message.message_type.name=== "VideoCall"||props.message.message_type.name===("VoiceCall")) {
        return (
          <div className="call-body">
            {(props.type === "first-chat" || props.type === "lonely") && (
                <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                {activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 <Image  alt="user-img" src={profile} width={30} height={30}/>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?
                    <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                  : <Image alt="user-img" src={profile} width={30} height={30}/>
                  }

              </div>
            )}
           {props.message.message_type.name===("VoiceCall")? <MissedIcon ></MissedIcon>:<VideoIconMissed/> }
            <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                  {activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                  activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   <Image alt="user-img" src={profile} width={30} height={30}/>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id===getUserChat()?.id)[0]?.user?.photo_path?
                      <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) === parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                    : <Image alt="user-img" src={profile} width={30} height={30}/>
                    }

                </div>
            <div className="missed-body">
              {translate('Missed  Call At',language)} {getMessageTime(props.message.created_at,true)}
            </div>
          </div>
        );
      }
    }
    else {
      if (props.message.message_type.name === "ImageMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
             {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
     
           
            <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body message-img-body ' + props.type}>
            {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
              <div className='border-element'>
                {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
              </div>
              {props.type === "first-chat" && <div className='bordse'></div>}

              {(props.type === "first-chat" || props.type === "lonely") &&
                <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                {activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 <Image alt="user-img" src={profile} width={30} height={30}/>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?
                    <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                  : <Image alt="user-img" src={profile} width={30} height={30}/>
                  }

              </div>}
              <img onClick={() => setImg((props.message.type || props.message.message_content[0]?.file_path.includes("https") || props.message.message_content[0]?.file_path.includes("http")) ? (
                props.message.message_content[0]?.file_path) : (
               props.message.message_content[0]?.file_path))} className='message-img' src={( props.message.message_content[0]?.file_path)} />
              <div className='other-date'>
                {getMessageTime(props.message.created_at,true)}
              </div>
            </div>
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />

          </div>)
      }
     if (props.message.message_type.name === "VideoMessage") {
        return(
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
             {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
     
           
            <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body message-img-body ' + props.type}>
            {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
              <div className='border-element'>
                {refmessage.current &&showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
              </div>
              {props.type === "first-chat" && <div className='bordse'></div>}

              {(props.type === "first-chat" || props.type === "lonely") &&
                    <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                    {activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                    activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name?
                     <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                     :
                     <Image alt="user-img" src={profile} width={30} height={30}/>
                     :
                     activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.name?
                     <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                     :
                     activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?
                        <Image  alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                      : <Image alt="user-img" src={profile} width={30} height={30}/>
                      }
    
                  </div>}
                <PlayIcon
                  onClick={() => {
                    setVid((props.message.type || props.message.message_content[0]?.file_path.includes("https") || props.message.message_content[0]?.file_path.includes("http")) ? (
                      props.message.message_content[0]?.file_path) : (
                     props.message.message_content[0]?.file_path))
                  }}
                  className="play-vid-icon"
                  
                ></PlayIcon>
              <video  className='message-img' src={( props.message.message_content[0]?.file_path)}>
                <source src={(props.message.message_content[0]?.file_path)}></source>
              </video>
              <div className='other-date'>
                {getMessageTime(props.message.created_at,true)}
              </div>
            </div>
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />

          </div>
        )
       }
      if (props.message.message_type.name === "VoiceMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
             {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
     
           
            {props.message.message_content && props.message.message_content[0]?.file_path && props.message.message_content[0]?.file_path !== "false" &&
              <div ref={refmessage} onClick={() => setOpen(true)} className={'message-element-body message-body audio-body him ' + props.type}>
                 {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
                <div className='border-element'>
                  {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
                </div>
                {(props.type === "first-chat" || props.type === "lonely") &&
              <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
              {activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
              activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name?
               <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
               :
               <Image alt="user-img" src={profile} width={30} height={30}/>
               :
               activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.name?
               <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
               :
               activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?
                  <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                : <Image alt="user-img" src={profile} width={30} height={30}/>
                }

            </div>}
                <div className='audio-message '>
                  <audio
                 onTimeUpdate={(e) => {
                  animate()
                  setWidth((parseFloat(e.target.currentTime) * 100) / parseFloat(AudioRef.current?.duration) * 1.8)
                  
                  }}  onEnded={() => { setPlay(false); AudioRef.current.currentTime = 0; setWidth(0)}} controls={false} ref={AudioRef} src={(props.message.message_content && props.message.message_content[0]?.file_path)}>
                    <source src={ (props.message.message_content && props.message.message_content[0]?.file_path)} />
                  </audio>
                  <RecordIcon></RecordIcon>
              {AudioRef.current?.duration? 
              
              !AudioRef.current.paused?
              <PauseIcon className='play-icon' onClick={() => { setPlay(!playing); if (playing) AudioRef.current.pause(); else AudioRef.current.play() }}></PauseIcon>:
              <PlayIcon className='play-icon' onClick={() => { setPlay(!playing); if (playing) AudioRef.current.pause(); else AudioRef.current.play() }}></PlayIcon>
              :
              <Spinner className="play-icon"/>
              }

                  <div className='player-cont'>
                    <div className='wave-absolute'>
                    {AudioRef.current?.duration!==Infinity&&AudioRef.current?.duration!==undefined&&AudioRef.current?.duration!==NaN&&showTime(AudioRef.current?.duration)!==null&&showTime(AudioRef.current?.duration)!==NaN&&showTime(AudioRef.current?.duration)!=='NaN'?
                      <div className='player-time'>{AudioRef.current && AudioRef.current?.duration && showTime(AudioRef.current?.duration)}</div>:
                      <div className='player-time'>00:00</div>}
                      <div className='wave' id={`wav${(props.message.id||props.message.mid)}`}><WaveIcon></WaveIcon></div>
                    </div>
                    <div className='player-line'></div>
                  </div>
                </div>
                <div className='other-date'>
                  {getMessageTime(props.message.created_at,true)}
                </div>
              </div>}
              <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />

          </div>
        )
      }
      if (props.message.message_type.name === "TextMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
             {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
     
           <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body text-body ' + props.type}>
            {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
              <div className='border-element'>
                {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") &&
                 <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                 {activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                 activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name?
                  <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                  :
                  <Image alt="user-img" src={profile} width={30} height={30}/>
                  :
                  activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.name?
                  <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                  :
                  activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?
                     <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                   : <Image alt="user-img" src={profile} width={30} height={30}/>
                   }
 
               </div>}
              {props.message.message_content && props.message.message_content?.content}

              <div className="other-date">{getMessageTime(props.message.created_at,true)}</div>
            </div>
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />
           
          </div>
        );
      }
      if (props.message.message_type.name === "FileMessage") {
        return (
          <div onMouseLeave={() => setOpen(false)} className={"message-hold" + " " + `${opens && "ac"}`}>
             {props.message.parent_message&&<RepliedMessage onClick={()=>props.GetMessage(props.message.id,props.message.parent_message_id)} message_ref={message_ref} message={props.message} parent_message={props.message.parent_message} moving={moving}/>}
     
            <div onClick={() => setOpen(true)} ref={refmessage} className={'message-element-body message-body text-body ' + props.type}>
            {(props.message.is_forward===true||props.message.is_forward===1)&&<div className="forwarded-message-icon"><ForwardIcon></ForwardIcon></div>}
              <div className='border-element'>
                {refmessage.current && showBord(props.type, refmessage.current.clientHeight).map((ad,i) => (
             <div className='border-child' key={i}></div>
           ))}
              </div>
              {(props.type === "first-chat" || props.type === "lonely") &&
                <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                {activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 <Image alt="user-img" src={profile} width={30} height={30}/>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?
                    <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                  : <Image alt="user-img" src={profile} width={30} height={30}/>
                  }

              </div>}
                {props.message?.message_content && props.message?.message_content[0]?.file_path && (
                <a
                  target="_blank"
                  href={(props.message.message_content[0]?.file_path.includes("https") || props.message.message_content[0]?.file_path.includes("http") || props.message.type) ? props.message.message_content[0]?.file_path :  props.message.message_content[0]?.file_path}
                  download
                  className="replay-msg file-msg"
                >
                  <Image alt="user-img" width={26} src={fil.src} height={20} style={{ width: "26px" }} />
                  <div className="file-desc">
                    <div className="file-name">
                      {"FILE"}
                    </div>
                    <div className="file-type">
                     
                    </div>
                  </div>
                  {props.message?.type ? (
                    <SpinIcon ></SpinIcon>
                  ) : (
                    <DownIcon style={{minWidth:"34px"}}></DownIcon>
                  )}
                </a>
              )}

              <div className="other-date">{getMessageTime(props.message.created_at,true)}</div>
            </div>
            <OptionsMenu copy={()=>copyText()} forward={() => dispatch({ type: "FORWARD-MESSAGEs", payload: props.message })} click={()=>dispatch({type:"REPLY-MESSAGE",payload:props.message})} />
           
          </div>
        );
      }
      if (props.message.message_type.name===("VideoCall")||props.message.message_type.name===("VoiceCall")) {
        return (
          <div className="call-body">
            {(props.type === "first-chat" || props.type === "lonely") && (
                <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                {activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 <Image  alt="user-img" src={profile} width={30} height={30}/>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.name?
                 <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id)!== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                 :
                 activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?
                    <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                  : <Image alt="user-img" src={profile} width={30} height={30}/>
                  }

              </div>
            )}
            {props.message.message_type.name===("VoiceCall")? <MissedIcon ></MissedIcon>:<VideoIconMissed/> }
            <div className={'absolute-avatar ' + `${(!activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path?.includes('eu'))&&activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name&& 'text-avatar'}`}>
                  {activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?.includes('eu') ?
                  activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   <Image alt="user-img" src={profile} width={30} height={30}/>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.name?
                   <>{getTwoLetters(activeChat.channel_members.filter((a) => parseInt(a.user_id)!== parseInt(getUserChat()?.id))[0]?.user?.name||activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.user_name)}</>
                   :
                   activeChat.channel_members.filter((user)=>user.user_id!==getUserChat()?.id)[0]?.user?.photo_path?
                      <Image alt="user-img" className='abs-avva' src={ (activeChat && activeChat.channel_members && (activeChat.channel_members.filter((a) => parseInt(a.user_id) !== parseInt(getUserChat()?.id))[0]?.user?.photo_path))} />
                    : <Image alt="user-img" src={profile} width={30} height={30}/>
                    }

                </div>
            <div className="missed-body">
            {translate('Missed  Call At',language)} {getMessageTime(props.message.created_at,true)}
            </div>
          </div>
        );
      }
    }
  };
  function handleTouchStart(evt, a, index) {
    isMove = null
    a.style.transform = `translateX(-${Math.abs(0)}px)`
                    a.nextElementSibling.style.opacity='0'
                    a.nextElementSibling.style.right=`${a.offsetWidth-40}px`
                    setOpen(false)
    a.addEventListener('touchmove', (e) => handleTouchMove(e, a, index), { passive: true});
    a.addEventListener('mousemove', (e) => handleTouchMove(e, a, index), {passive: true});

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
    document.querySelectorAll(".message-element.self-align .message-element-body.message-body").forEach((a, index) => {
        a.addEventListener('touchstart', (e) => handleTouchStart(e, a, index), {passive: true});
        a.addEventListener('touchend', (e) => handleTouchEnd(e, a, index), false);
        a.addEventListener('mousedown', (e) => handleTouchStart(e, a, index), false);
        a.addEventListener('mouseup', (e) => handleTouchEnd(e, a, index), false);
    })
}, [])
useEffect(()=>{
;
},[AudioRef.current])
function getTouches(evt) {
    return evt.touches ||             // browser API
        [evt]; // jQuery
}
function handleTouchMove(evt, a, indexx) {


    evt.preventDefault()
    if (!xDown || !yDown) {
        return;
    }
    document.querySelectorAll(".message-element.self-align .message-element-body.message-body").forEach((v, index) => {
        if (indexx !== index) {
            v.style.transform = "translateX(0px)"
            if(v.nextElementSibling){
            v.nextElementSibling.style.opacity='0'
                    v.nextElementSibling.style.right=`${a.offsetWidth-40}px`}
                    setOpen(false)
        }
    })
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
            }
        } else {
            if (Math.abs(xDiff) < 180) {
                moving = true
                
                a.style.transform = `translateX(${Math.abs(80)}px)`
                if(a.nextElementSibling){
                a.nextElementSibling.style.opacity='1'
                a.nextElementSibling.style.right=`${a.offsetWidth-60}px`
                a.nextElementSibling.style.left=`initial`}
                setOpen(false)
            }


        }
    } 
    /* reset values */

};
useEffect(() => {
    document.querySelectorAll(".message-element").forEach((a) => {
        a.addEventListener("mouseleave", function () {
            setTimeout(() => {
                document.querySelectorAll(".message-element.self-align .message-element-body.message-body").forEach((v, index) => {

                    v.style.transform = "translateX(0px)"
                    if(v.nextElementSibling){
                    v.nextElementSibling.style.opacity='0'
                    v.nextElementSibling.style.right=`${a.offsetWidth-40}px`}
                    setOpen(false)
                })
            }, 300);
        })
    })
}, [])
  return (<>
    {props.message && <div id={`main-container-${props.message.id}`} style={{marginTop:message_ref.current&&`${message_ref.current.clientHeight*0.84}px`}}
      className={
        "message-container message-element" +
        ` ${props.marg &&!props.message.parent_message&& "mt25"} ${parseInt(props.message.sender_user_id) ===
        parseInt(getUserChat()?.id) &&
        "self-align"
        } ${(props.message.message_type.name === "VideoCall" ||props.message.message_type.name===("VoiceCall")) && "center-align"}`
      }
    >
      {showMessage()}
    </div>}
  </>

  );
}

export default ChatMessage;
