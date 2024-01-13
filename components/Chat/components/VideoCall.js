import React, { useEffect, useRef, useState } from 'react'
import EndCallIcon from '../svg/endCall.svg';
import MicIcon from '../svg/micIcon.svg';
import VideoIcon from '../svg/vidIcon.svg';
import CallIcon from '../svg/CallInProg.svg';
import CallingIcon from '../svg/calling.svg';
import LeftArrowIcon from '../svg/leftArrow.svg';
import "./index.css"
import AgoraRTC, {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-react";
import { useDispatch, useSelector } from 'react-redux';
import {useStopwatch} from 'react-timer-hook'
import { RefuseCall } from 'store/chat/actions';
import { getTwoLetters } from '../chatsFunctions';
import axios from 'axios';
import { CHAT_URL } from 'utils/endpointConfig';
import { getUserChat, translate } from 'utils/functions';
const config = { 
  mode: "rtc", codec: "h264",
};
AgoraRTC.setLogLevel(3);
const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const appId = "0af959943ff542df8f2cb1b925ec0cc1"; 
function VideoCall(props) {
  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
  useStopwatch({ autoStart: false });
  const dispatch = useDispatch();
  const [callStatus,setCallStatus]=useState(null)
  const activeChat = useSelector(state => state.chat.activeChat)
  // React.useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setRender(!render)
  //   }, 2000)
  //   return () => clearTimeout(timeout)
  // }, [render])
  const language=useSelector((state)=>state.homepage.language)
  useEffect(()=>{
    // setTimeout(()=>{
    //   if(users.length===0&&!isRunning){
    //     setCallStatus(translate('No Answer',language))
    //     setTimeout(() => {
    //       userEndCall()
    //     }, 2000);
    //   }
    // },30000)
  },[])
  const [users, setUsers] = useState([]);
  const [startIndicator, setStart] = useState(false);
  const client = useClient(config);
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks,error } = useMicrophoneAndCameraTracks();
  const getToken=async (channelName)=>{
    let token
  let data=await axios.post(CHAT_URL+'/api/v1/agora/token',{
    channel_name:channelName
  },{headers:{
    Authorization:'Bearer '+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
  }}).then((datas)=>{
    token=datas.data.data
  })
  
  return token
  }
  useEffect(() => {
    // function to initialise the SDK
    let init = async (name) => {
      client.on('user-joined',(user)=>{
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log('user-joined')
        start()
        setUsers((prevUsers) => {
          return [...prevUsers, user];
        });
      })
      client.on("user-published", async (user, mediaType) => {
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log('user-published')
        await client.subscribe(user, mediaType);
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("subscribe success");
        if (mediaType === "video") {
          start()
          
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, type) => {
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("unpublished", user, type);
        if (type === "audio") {
          user.audioTrack?.stop();
        }
        if (type === "video") {
          
        }
      });

      client.on("user-left", (user) => {
        userEndCall()
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("leaving", user);
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
        
      });
      let token=props.token
      
      await client.join(appId, name.toString(), token, getUserChat()?.id);
      if (tracks) await client.publish([tracks[0], tracks[1]]);
      setStart(true);

    };

    if (ready && tracks) {
      if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("init ready");
      init(activeChat.id);
    }
if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(error,ready,tracks)
  }, [ client, ready, tracks,error]);
  const MessageActiveCall = useSelector(state => state.chat.MessageActiveCall)
  const userEndCall =async () => {
    if(ready){await client.leave();
    client.removeAllListeners();
    // we close the tracks to perform cleanup
    if(tracks){
    tracks[0]?.close();
    tracks[1].close();}}
    setStart(false);
    RefuseCall(activeChat.id,MessageActiveCall)

    pause()
    dispatch({type:"END-CALL"})
  }
  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const mute = async (type) => {
    if (type === "audio") {
      await tracks[0]?.setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    } else if (type === "video") {
      await tracks[1].setEnabled(!trackState.video);
      setTrackState((ps) => {
        return { ...ps, video: !ps.video };
      });
    }
  };
  const callInProgress=useSelector((state)=>state.chat.callInProgress);
  useEffect(()=>{
    if(callInProgress===2){
      setCallStatus(translate('User declined',language))
      setTimeout(() => {
        userEndCall()
      }, 2000);
   
      
    }
  },[callInProgress])
  return (
    <>
      {<div
        className='video-call'
      >
        {props.audio&&!users.length>0&&!callStatus&&
         <audio  onLoad={(e)=>{e.target.volume=0.2}} onPlay={(e)=>{e.target.volume=0.2}} onLoadStart={(e)=>{e.target.volume=0.2}}   loop autoPlay src={'/default.mp3'}>
         <source src={'/default.mp3'}></source>
     </audio>}
        
        {
       
        
        <>
        {props.active?
        <div className='hgg' style={{
        backgroundImage: `url(${props.active})`,
        }}>

        </div>
        :
        props.name?
        <div className='hgg text-avatar'>
        {getTwoLetters(props.name)}
        </div>
        :
        <div className='hgg' style={{
        backgroundImage: `url(${'/images/profileNo.png'})`,
        }}>

        </div>
        }
        </>
      }
      <span className='caller-name'>
        {props.name}
      </span>
       
        {users.length > 0 &&
          users.map((user) => {
            if (user.videoTrack) {
              return (
                <AgoraVideoPlayer className='my-screen'   id="remote-stream" style={{height: '100%', width: '100%'}} videoTrack={user.videoTrack}/>
              );
            } else return <></>;
          })}
        <div
          style={tracks &&tracks[1] && { zIndex: 3 }}
          className="end-icon"
          onClick={() => {RefuseCall(activeChat.id,MessageActiveCall); userEndCall(); }}>
          <EndCallIcon ></EndCallIcon>
          <span>{translate("End Call",language)}</span>
        </div>
        <div className='cancel-call-icon' onClick={() => {RefuseCall(activeChat.id,MessageActiveCall); userEndCall();}}>
          <LeftArrowIcon></LeftArrowIcon>
        </div>
        <div className='add-caller-icon'>
      {tracks&&tracks.length>1&&tracks[1]&&  <AgoraVideoPlayer className='local-video-stream'  videoTrack={tracks[1]} />}
        </div>
        <div className={'toggle-mic ' +( trackState.audio&&"active-mic-svg")} onClick={()=>mute("audio")}><MicIcon></MicIcon></div>
        <div className={'toggle-vid '+ (trackState.video&&"active-mic-svg")} onClick={()=>mute("video")}><VideoIcon></VideoIcon></div>
        {ready&&users.length===0&&<div className='call-status'>
         {isRunning?<CallIcon></CallIcon>: <CallingIcon></CallingIcon>}
         {callStatus?<span>{callStatus}</span>:isRunning?<span>{minutes>9?minutes:'0'+minutes}:{seconds>9?seconds:'0'+seconds}</span>:<span>{translate("Calling ...",language)}</span>}
        </div>}
      </div>}
    </>

  );
};

export default VideoCall