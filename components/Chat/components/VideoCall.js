import React, { useEffect, useRef, useState } from 'react'
import EndCallIcon from '../svg/endCall.svg';
import MicIcon from '../svg/micIcon.svg';
import VideoIcon from '../svg/vidIcon.svg';
import CallIcon from '../svg/CallInProg.svg';
import CallingIcon from '../svg/calling.svg';
import AddUserIcon from '../svg/addUser.svg';
import LeftArrowIcon from '../svg/leftArrow.svg';
import "./index.css"
import { pusher } from '../../../utils/constants';
import Peer from 'simple-peer';
import { useDispatch, useSelector } from 'react-redux';
import auds from "../../../public/default.mp3"
import {useStopwatch} from 'react-timer-hook'
function VideoCall(props) {
  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
  useStopwatch({ autoStart: false });
  const dispatch = useDispatch()
  const activeChat = useSelector(state => state.chat.activeChat)

  const user = JSON.parse(localStorage.getItem("USER-CHAT"))
  let peers = []
  const [peerStarted, setPeerStarted] = useState(false)
  const [render, setRender] = useState(false)
  const myVideo = useRef()
  const userVideo = useRef()
  let myMediaHandler = useRef();
  let userMediaHandler = useRef();
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setRender(!render)
    }, 2000)
    return () => clearTimeout(timeout)
  }, [render])
  const ref = useRef()


  let channel = pusher.subscribe(`presence-video-call-${props.channel}`);
  channel.bind(`client-signal-${user.id}`, (signal) => {
    if (parseInt(signal.userId) !== parseInt(user.id)) {
      let peer = peers[signal.userId];
      // if peer is not already exists, we got an incoming call
      if (peers[signal.userId] === undefined && peerStarted === false && render) {
        peers[signal.userId] = startPeer(signal.userId, false)
        setPeerStarted(true)
      } else {
        if(!peer?.connected)
        peer?.signal(signal.data);
      }
      // 

    }
  })
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(async (stream) => {
        myMediaHandler.current = stream
        try {
         
        } catch (e) {
          
        }
        
        peers[props.user_id] = startPeer(props.user_id);
      })
      .catch(err => {
        throw new Error(`Unable to fetch stream ${err}`);
      })
  }, [])
const [videoEnabled,setVideoEnabled]=useState(true);

const [audioEnabled,setAudioEnabled]=useState(true);
  const startPeer = (userId, initiator = true) => {
    const peer = new Peer({
      initiator,
      stream: myMediaHandler.current,
      trickle: true,
      // allowHalfTrickle: true,
      config: {
        iceServers: [
          {
            urls: "stun:relay.metered.ca:80",
          },
          {
            urls: "turn:relay.metered.ca:80",
            username: "806e6251439819449d0461e8",
            credential: "WCIdetfnlbmV/yWP",
          },
          {
            urls: "turn:relay.metered.ca:443",
            username: "806e6251439819449d0461e8",
            credential: "WCIdetfnlbmV/yWP",
          },
          {
            urls: "turn:relay.metered.ca:443?transport=tcp",
            username: "806e6251439819449d0461e8",
            credential: "WCIdetfnlbmV/yWP",
          },
        ],
      }
    });
    // peer._debug = console.log
    peer.on('signal', (data) => {
      channel.trigger(`client-signal-${userId}`, {
        type: 'signal',
        userId: user.id,
        data: data
      });
      channel.bind('client-user-toggle-vid',(data)=>{
        if(parseInt(data.userId)!==parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)){
         
        setVideoEnabled(parseInt(data.value)===0?1:0)}
      })
      channel.bind('client-user-toggle-aud',(data)=>{
        if(parseInt(data.userId)!==parseInt(JSON.parse(localStorage.getItem("USER-CHAT")).id)){
          
        setAudioEnabled(parseInt(data.value)===0?1:0)}
      })
      channel.bind(`client-refuse-${userId}`, () => {
        userEndCall()
      })
      channel.bind(`client-end-call-${userId}`, () => {
        userEndCall()
      })
    })

    peer.on('stream', (stream) => {
      start()
      userMediaHandler.current = stream
      try {
        userVideo.current.srcObject = stream;
      } catch (e) {
        userVideo.current.src = URL.createObjectURL(stream);
      }
      userVideo.current.play();
    });

    peer.on('close', () => {
      let peer = peers[userId];
      if (peer !== undefined) {
        peer.destroy();
      }

      peers[userId] = undefined;
    });

    peer.on('error', (err) => {
      
      let peer = peers[userId];
      if (peer !== undefined) {
        peer.destroy();
      }
      peers[userId] = undefined;
    })
    return peer;
  }

  const userEndCall = () => {
    channel.unbind(`client-refuse-${props.user_id}`)
    channel.unbind(`client-end-call-${props.user_id}`)
    channel.unbind(`client-signal-${user.id}`)
    channel.bind(`client-signal-${JSON.parse(localStorage.getItem("USER-CHAT")).id}`, (signal) => {
      let caller = activeChat.channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]
      let callerChannel = activeChat
      dispatch({
        type: "INCOMING_CALL", payload: {
          signal,
          caller,
          callerChannel
        }
      })
    })
    myMediaHandler.current?.getTracks()?.forEach((track) => {
      track.stop();
    });
    userMediaHandler.current?.getTracks()?.forEach((track) => {
      track.stop();
    });
    peers[props.user_id]?.destroy()
    peers[user.id]?.destroy()
    peers = []
    dispatch({ type: "USER_END_CALL" })
    userMediaHandler.current=null
    pause()
  }

  const meEndCall = () => {
    channel.unbind(`client-refuse-${props.user_id}`)
    channel.unbind(`client-end-call-${props.user_id}`)
    channel.unbind(`client-signal-${user.id}`)
    channel.bind(`client-signal-${JSON.parse(localStorage.getItem("USER-CHAT")).id}`, (signal) => {
      let caller = activeChat.channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]
      let callerChannel = activeChat
      dispatch({
        type: "INCOMING_CALL", payload: {
          signal,
          caller,
          callerChannel
        }
      })
    })
    myMediaHandler.current?.getTracks()?.forEach((track) => {
      track.stop();
    });
    userMediaHandler.current?.getTracks()?.forEach((track) => {
      track.stop();
    });
    peers[props.user_id]?.destroy()
    peers[user.id]?.destroy()
    peers = []
    dispatch({ type: "ME_END_CALL" })
    userMediaHandler.current=null
    pause()
  }
  const [UseraudioEnabled,setAudioUserEnabled]=useState(1)
  const [UservideoEnabled,setUservideoEnabled]=useState(1)
const togglevid=()=>{
 channel.trigger("client-user-toggle-vid",{value:UservideoEnabled===0?1:0,userId:JSON.parse(localStorage.getItem("USER-CHAT")).id})
 setUservideoEnabled(UservideoEnabled===0?1:0)

}
const toggleAudio=()=>{
  channel.trigger("client-user-toggle-aud",{value:UseraudioEnabled===0?1:0,userId:JSON.parse(localStorage.getItem("USER-CHAT")).id})
  setAudioUserEnabled(UseraudioEnabled===0?1:0)
}
  return (
    <>
      {<div
        className='video-call'
      >{(!userMediaHandler.current||!videoEnabled)&&
      <>
      <div className='hgg' style={{
        backgroundImage: `url(${props.active})`,
      }}></div>
      <span className='caller-name'>
        {props.name}
      </span>
      </>}
        {<video
          ref={(ref) => { userVideo.current = ref; }}
          id="remote-stream"
          muted={audioEnabled.current?false:true}
          className='my-screen'
          style={userMediaHandler.current && { zIndex: 3 ,opacity:videoEnabled?"1":"0"}}
        >
          {/* <img style={{ width: "100%", height: "100%", filter: "blur(10px)" }} src={props.active} /> */}
        </video>}
        <audio ref={ref} loop autoPlay src={auds} muted={userMediaHandler.current} onPlay={() => ref.current.volume = 0.05}>
          <source src={auds}></source>
        </audio>
        <div
          style={myMediaHandler.current && { zIndex: 3 }}
          className="end-icon"
          onClick={() => meEndCall()}>
          <EndCallIcon ></EndCallIcon>
          <span>End Call</span>
        </div>
        <div className='cancel-call-icon'>
          <LeftArrowIcon></LeftArrowIcon>
        </div>
        <div className='add-caller-icon'>
          <AddUserIcon></AddUserIcon>
        </div>
        <div className={'toggle-mic ' +( UseraudioEnabled===0&&"active-mic-svg")} onClick={()=>toggleAudio()}><MicIcon></MicIcon></div>
        <div className={'toggle-vid '+ (UservideoEnabled===0&&"active-mic-svg")} onClick={()=>togglevid()}><VideoIcon></VideoIcon></div>
        {!userMediaHandler.current&&<div className='call-status'>
         {userMediaHandler?<CallIcon></CallIcon>: <CallingIcon></CallingIcon>}
         {userMediaHandler?<span>{minutes}:{seconds}</span>:<span>Calling ...</span>}
        </div>}
      </div>}
    </>

  );
};

export default VideoCall