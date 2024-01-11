import React, { useState,useEffect } from 'react'
import EndCallIcon from '../Chat/svg/endCall.svg';
import MicIcon from '../Chat/svg/micIcon.svg';
import VideoIcon from '../Chat/svg/vidIcon.svg';
import CallIcon from '../Chat/svg/CallInProg.svg';
import CallingIcon from '../Chat/svg/calling.svg';
import LeftArrowIcon from '../Chat/svg/leftArrow.svg';
import {
    AgoraVideoPlayer,
    createClient,
    createMicrophoneAndCameraTracks,
  } from "agora-rtc-react";
  import AgoraRTC from "agora-rtc-sdk-ng";
  import {useStopwatch} from 'react-timer-hook'
const config = { 
    mode: "rtc", codec: "h264",
  };
  AgoraRTC.setLogLevel(3);

  const useClient = createClient(config);
  const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();
  
  const appId = "0af959943ff542df8f2cb1b925ec0cc4"; 
function WebViewVideoCall(props) {
    
    const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
    useStopwatch({ autoStart: false });
    const [callStatus,setCallStatus]=useState(null)
    useEffect(()=>{
   
    },[])
    const [users, setUsers] = useState([]);
    const [startIndicator, setStart] = useState(false);
    const client = useClient(config);
    // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
    const { ready, tracks,error } = useMicrophoneAndCameraTracks();
    useEffect(() => {
      // function to initialise the SDK
      let init = async (name) => {
        client.on('user-joined',(user)=>{
          start()
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
        })
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("subscribe success");
          try{
            user?.audioTrack?.play();
          }
          catch(e){
            // alert(e.message)
          }
          
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
          setCallStatus('')
          if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("leaving", user);
          setUsers((prevUsers) => {
            return prevUsers.filter((User) => User.uid !== user.uid);
          });
          
        });
       
        let token=props.data.token
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(appId, name.toString(), token, parseInt(props.data.sender_user_id))
        await client.join(appId, name.toString(), token, parseInt(props.data.sender_user_id));
        if (tracks) await client.publish([tracks[0], tracks[1]]);
        setStart(true);
  
      };
  
      if (ready && tracks) {
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("init ready");
        init(props.data.channel_id);
      }
    }, [ client, ready, tracks,error]);
    const userEndCall =async () => {
      await client.leave();
      client.removeAllListeners();
      // we close the tracks to perform cleanup
      if(tracks){
      tracks[0]?.close();
      tracks[1].close();}
      setStart(false);
    //   RefuseCall(activeChat.id,MessageActiveCall)
  
      pause();
     props.onDecline()
    //   dispatch({type:"END-CALL"})
    }
    const [trackState, setTrackState] = useState({ video: true, audio: true });
    const mute = async (type) => {
      if (type === "audio") {
        await tracks[0]?.setMuted(false)
        await tracks[0]?.setEnabled(!trackState.audio);
        setTrackState((ps) => {
          return { ...ps, audio: !ps.audio };
        });
      } else if (type === "video") {
        await tracks[0]?.setMuted(false)
        await tracks[1].setEnabled(!trackState.video);
        setTrackState((ps) => {
          return { ...ps, video: !ps.video };
        });
      }
    };
   
    // useEffect(()=>{
    //   if(callInProgress===2){
    //     setCallStatus(translate('User declined',language))
    //     setTimeout(() => {
    //       userEndCall()
    //     }, 2000);
     
        
    //   }
    // },[callInProgress])
    return (
      <>
        {<div
          className='video-call webview'
        >
          
          {
         
          
          <>
          {props.active?
          <div className='hgg' style={{
          backgroundImage: `url(${props.active})`,
          left:0,
          right:0,
          margin:'0 auto'
          }}>
  
          </div>
          :
          props.name?
          <div className='hgg text-avatar' style={{ left:0,
            right:0,
            margin:'0 auto'}}>
          {getTwoLetters('User')}
          </div>
          :
          <div className='hgg' style={{
          backgroundImage: `url(${'/images/profileNo.png'})`,
          left:0,
          right:0,
          margin:'0 auto'
          }}>
  
          </div>
          }
          </>
        }
        <span className='caller-name'>
          {props.data.receiver_user_id}
        </span>
         
          {users.length > 0 &&
            users.map((user) => {
              if (user.videoTrack) {
                return (
                  <AgoraVideoPlayer  className='my-screen'   id="remote-stream" style={{height: '100%', width: '100%'}} videoTrack={user.videoTrack} key={user.uid} />
                );
              } else return <></>;
            })}
          <div
            style={tracks &&tracks[1] && { zIndex: 3 }}
            className={"end-icon "+`${props.data.loading&&'disabled-label'}`}
            onClick={() => { userEndCall(); }}>
            <EndCallIcon ></EndCallIcon>
            <span>End Call</span>
          </div>
          <div className={'cancel-call-icon '+`${props.data.loading&&'disabled-label'}`} onClick={() => {userEndCall();}}>
            <LeftArrowIcon></LeftArrowIcon>
          </div>
          <div className='add-caller-icon'>
        {tracks&&tracks.length>1&&tracks[1]&&  <AgoraVideoPlayer className='local-video-stream'  videoTrack={tracks[1]} />}
          </div>
          <div className={'toggle-mic ' +( trackState.audio&&"active-mic-svg")} onClick={()=>mute("audio")}><MicIcon></MicIcon></div>
          <div className={'toggle-vid '+ (trackState.video&&"active-mic-svg")} onClick={()=>mute("video")}><VideoIcon></VideoIcon></div>
          {ready&&users.length===0&&<div className='call-status'>
           {isRunning?<CallIcon></CallIcon>: <CallingIcon></CallingIcon>}
           {callStatus?<span>{callStatus}</span>:isRunning?<span>{minutes>9?minutes:'0'+minutes}:{seconds>9?seconds:'0'+seconds}</span>:<span>{props.data.actionInit==='sent'?'Calling...':'Establish Connection..'}</span>}
          </div>}
        </div>}
       {error&&<div  className='error' style={{display:'flex',justifyContent:"flex-start",padding:'10px',flexDirection:"column"}}>
        
        <span> Errors:{error?.message||'None'}</span> 
        </div>}
      </>
  
    );
}

export default WebViewVideoCall