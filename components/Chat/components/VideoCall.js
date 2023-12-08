import React, { useEffect, useRef, useState } from 'react'
import EndCallIcon from '../svg/endCall.svg';
import MicIcon from '../svg/micIcon.svg';
import VideoIcon from '../svg/vidIcon.svg';
import CallIcon from '../svg/CallInProg.svg';
import CallingIcon from '../svg/calling.svg';
import AddUserIcon from '../svg/addUser.svg';
import LeftArrowIcon from '../svg/leftArrow.svg';
import "./index.css"
import {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-react";
import { useDispatch, useSelector } from 'react-redux';
import {useStopwatch} from 'react-timer-hook'
import { RefuseCall } from '../../../redux/chat/actions';
import { getTwoLetters } from '../chatsFunctions';
import axios from 'axios';
import { CHAT_URL } from '../../../utils/endpointConfig';
import { getUserChat } from '../../../utils/functions';
const config = { 
  mode: "rtc", codec: "vp8",
};

const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const appId = "0af959943ff542df8f2cb1b925ec0cc1"; 
function VideoCall(props) {


  const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
  useStopwatch({ autoStart: false });
  const dispatch = useDispatch()
  const activeChat = useSelector(state => state.chat.activeChat)

  const user = JSON.parse(localStorage.getItem("USER-CHAT"))
  const [render, setRender] = useState(false)
  // React.useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setRender(!render)
  //   }, 2000)
  //   return () => clearTimeout(timeout)
  // }, [render])

  
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
        start()
      })
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        console.log("subscribe success");
        if (mediaType === "video") {
          start()
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, type) => {
        console.log("unpublished", user, type);
        if (type === "audio") {
          user.audioTrack?.stop();
        }
        if (type === "video") {
          setUsers((prevUsers) => {
            return prevUsers.filter((User) => User.uid !== user.uid);
          });
        }
      });

      client.on("user-left", (user) => {
        console.log("leaving", user);
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
        userEndCall()
      });
      let token=props.token
      
      await client.join(appId, name, token, getUserChat().id);
      if (tracks) await client.publish([tracks[0], tracks[1]]);
      setStart(true);

    };

    if (ready && tracks) {
      console.log("init ready");
      init(activeChat.id);
    }
console.log(error,ready,tracks)
  }, [ client, ready, tracks,error]);
  const userEndCall =async () => {
    await client.leave();
    client.removeAllListeners();
    // we close the tracks to perform cleanup
    tracks[0].close();
    tracks[1].close();
    setStart(false);
    RefuseCall(activeChat.id)

    pause()
  }
  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const mute = async (type) => {
    if (type === "audio") {
      await tracks[0].setEnabled(!trackState.audio);
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
  return (
    <>
      {<div
        className='video-call'
      >
        
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
                <AgoraVideoPlayer className='my-screen'   id="remote-stream" style={{height: '95%', width: '95%'}} videoTrack={user.videoTrack} key={user.uid} />
              );
            } else return <></>;
          })}
        <div
          style={tracks &&tracks[1] && { zIndex: 3 }}
          className="end-icon"
          onClick={() => {userEndCall(); RefuseCall(activeChat.id)}}>
          <EndCallIcon ></EndCallIcon>
          <span>End Call</span>
        </div>
        <div className='cancel-call-icon' onClick={() => {userEndCall(); RefuseCall(activeChat.id)}}>
          <LeftArrowIcon></LeftArrowIcon>
        </div>
        <div className='add-caller-icon'>
          <AddUserIcon></AddUserIcon>
        </div>
        <div className={'toggle-mic ' +( trackState.audio&&"active-mic-svg")} onClick={()=>mute("audio")}><MicIcon></MicIcon></div>
        <div className={'toggle-vid '+ (trackState.video&&"active-mic-svg")} onClick={()=>mute("video")}><VideoIcon></VideoIcon></div>
        {ready&&!tracks[1]&&<div className='call-status'>
         {isRunning?<CallIcon></CallIcon>: <CallingIcon></CallingIcon>}
         {isRunning?<span>{minutes>9?minutes:'0'+minutes}:{seconds>9?seconds:'0'+seconds}</span>:<span>Calling ...</span>}
        </div>}
      </div>}
    </>

  );
};

export default VideoCall