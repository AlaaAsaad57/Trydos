import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {index} from 'store';
import { getUserChat } from './functions';
import { GetChats, InitPusherChannel } from 'store/chat/actions';

const firebaseConfig = {
  apiKey: "AIzaSyAl53TxLa2CoTBeXtg9K3Lr8G908ajb6kY",
  authDomain: "trydos-ce234.firebaseapp.com",
  projectId: "trydos-ce234",
  storageBucket: "trydos-ce234.appspot.com",
  messagingSenderId: "912302743695",
  appId: "1:912302743695:web:17d05f7385b792bf4110fa",
  measurementId: "G-N8LNVEWJSJ"
};
const firebaseApp = initializeApp(firebaseConfig);
export const messaging =typeof window !=='undefined'&& 'serviceWorker' in navigator&& getMessaging(firebaseApp);

export const requestFirebaseNotificationPermission = async () => {
  return getToken(messaging).then((currentToken) => {
    if (currentToken) {
     
      return (currentToken)
      // Track the token -> client mapping, by sending to backend server
      // show on the UI that permission is secured
    } else {
     

      // shows on the UI that permission is required 
    }
  }).catch((err) => {
    console.error(err)
    // catch error while creating client token
  });
}
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(payload)
      if(payload.data.type==="RefuseCallEvent"){
        if(index.getState().chat.callInProgress){
          index.dispatch({ type: "USER_END_CALL" })
        }
        else{
          index.dispatch({ type: "END-CALL" })
        }
      }
     if(payload.data.type==="VoiceCallEvent"){
      let data=JSON.parse(payload.data.data).payload
      let channel=index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]:  {id:JSON.parse(payload.data.data).message.channel.id,messages:[{...JSON.parse(payload.data.data).message,message_type:{name:'VoiceCall'}}],channel_members:[{user_id:data.user_id,user:{id:data.user_id,name:data.callerName,photo_path:data.callerPhoto},mute:0,pin:0,archived:0},{mute:0,pin:0,archived:0,user_id:getUserChat()?.id,user:getUserChat()}]}
      let caller = index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId)).length>0?index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?.channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]:{user:{name:data.callerName,photo_path:data.callerPhoto}}
     
      if(data.user_id!==getUserChat()?.id&&(!index.getState().chat.callInProgress||index.getState().chat.callInProgress===2)){
        if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(data,channel,caller);
        index.dispatch({ type: "INCOMING_VOICE_CALL",payload:{...data,channelId:JSON.parse(payload.data.data).message.channel.id,callerChannel: channel,caller:caller,message_id:JSON.parse(payload.data.data).message.id} })
      }
      index.dispatch({type:"SET_LAST_NOTIFICATION_DATE",payload:(new Date()).toLocaleString()})
      index.dispatch({ type: "REC_CHA", payload: parseInt(JSON.parse(payload.data.data).message.channel.id)})
      if(parseInt(index?.getState()?.chat?.activeChat?.id)===parseInt(JSON.parse(payload.data.data)?.message.channel?.id)){
        index.dispatch({type:"WATCH_CHANNEL",payload:parseInt(JSON.parse(payload.data.data).message?.channel?.id)})
      }else{
        let active=index?.getState()?.chat?.activeChat
        if(active?.id &&active?.channel_members.filter((mem)=>mem.user_id===getUserChat()?.id && mem.user.mute===1).length>0){
          ;
        }
        else{
        
          let not = new Audio('/wa.mp3');
          not.volume = 0.5
          not.play()
        }
      
      }
      index.dispatch({type:"SEND-MESSAGE",payload:{act:JSON.parse(payload.data.data).message.channel,message:{...JSON.parse(payload.data.data).message,channel:null,message_type:{name:'VoiceCall'},message_status:[]}}})
        
      resolve(payload);
     }
     else if(payload.data.type==="VideoCallEvent"){

      let data=JSON.parse(payload.data.data).payload
      let channel=index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]:{id:JSON.parse(payload.data.data).message.channel.id,messages:[{...JSON.parse(payload.data.data).message,message_type:{name:'VideoCall'}}],channel_members:[{user_id:data.user_id,user:{id:data.user_id,name:data.callerName,photo_path:data.callerPhoto},mute:0,pin:0,archived:0},{mute:0,pin:0,archived:0,user_id:getUserChat()?.id,user:getUserChat()}]}
      let caller = index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId)).length>0?index.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?.channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]:{user:{name:data.callerName,photo_path:data.callerPhoto}}
      if(data.user_id!==getUserChat()?.id&&(!index.getState().chat.callInProgress||index.getState().chat.callInProgress===2)){
      index.dispatch({ type: "INCOMING_CALL",payload:{...data,channelId:JSON.parse(payload.data.data).message.channel.id,callerChannel: channel,caller:caller,message_id:JSON.parse(payload.data.data).message.id} })}
        index.dispatch({type:"SET_LAST_NOTIFICATION_DATE",payload:(new Date()).toLocaleString()})
     index.dispatch({ type: "REC_CHA", payload: parseInt(JSON.parse(payload.data.data).message.channel.id)})
     if(parseInt(index?.getState()?.chat?.activeChat?.id)===parseInt(JSON.parse(payload.data.data)?.message?.channel?.id)){
       index.dispatch({type:"WATCH_CHANNEL",payload:parseInt(JSON.parse(payload.data.data).message?.channel?.id)})
     }else{
       let active=index?.getState()?.chat?.activeChat
       if(active?.id &&active?.channel_members.filter((mem)=>mem.user_id===getUserChat()?.id && mem.user.mute===1).length>0){
         ;
       }
       else{
       
         let not = new Audio('/wa.mp3');
         not.volume = 0.5
         not.play()
       }
     
     }
     index.dispatch({type:"SEND-MESSAGE",payload:{act:JSON.parse(payload.data.data).message.channel,message:{...JSON.parse(payload.data.data).message,channel:null,message_type:{name:'VideoCall'},message_status:[]}}})
       
     resolve(payload);
    
     }
     else if(payload.data.type==="message"){
      InitPusherChannel(JSON.parse(payload.data.message).channel.id);
      if(index?.getState()?.chat?.data.filter((chat)=>parseInt(chat.id)===parseInt(JSON.parse(payload?.data.message)?.channel?.id))[0]?.messages.filter((message)=>parseInt(message.id)===parseInt(payload.data.prev_message_id)).length>0){
         index.dispatch({type:"SET_LAST_NOTIFICATION_DATE",payload:(new Date()).toLocaleString()})
      index.dispatch({ type: "REC_CHA", payload: parseInt(JSON.parse(payload.data.message).channel.id)})
      if(parseInt(index?.getState()?.chat?.activeChat?.id)===parseInt(JSON.parse(payload?.data.message)?.channel?.id)){
        index.dispatch({type:"WATCH_CHANNEL",payload:parseInt(JSON.parse(payload.data.message)?.channel?.id)})
      }else{
        let active=index?.getState()?.chat?.activeChat
        if(active?.id &&active?.channel_members.filter((mem)=>mem.user_id===getUserChat()?.id && mem.user.mute===1).length>0){
          ;
        }
        else{
        
          let not = new Audio('/wa.mp3');
          not.volume = 0.5
          not.play()
        }
      
      }
      index.dispatch({type:"SEND-MESSAGE",payload:{act:JSON.parse(payload.data.message).channel,message:{...JSON.parse(payload.data.message),channel:null}}})
        
      resolve(payload);}
      else{
        GetChats(true)
      }}
    });
  });
  