import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {store} from '../redux/store';
import { getUserChat } from './functions';
import { GetChats, InitPusherChannel } from '../redux/chat/actions';

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
      console.log(payload)
      if(payload.data.type==="RefuseCallEvent"){
        if(store.getState().chat.callInProgress){
          store.dispatch({ type: "USER_END_CALL" })
        }
        else{
          store.dispatch({ type: "END-CALL" })
        }
      }
     if(payload.data.type==="VoiceCallEvent"){
      let data=JSON.parse(payload.data.data).payload
      let channel=store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]:  {id:JSON.parse(payload.data.data).message.channel.id,messages:[{message_type:{name:'VoiceCall'}}],channel_members:[{user_id:data.user_id,user:store.getState().chat.contacts.filter((s)=>s.contact_user_id===data.user_id)[0],mute:0,pin:0,archived:0},{mute:0,pin:0,archived:0,user_id:getUserChat().id,user:getUserChat()}]}
      let caller = store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId)).length>0?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?.channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]:{user:{name:data.callerName,photo_path:data.callerPhoto}}
     
      if(data.user_id!==getUserChat().id&&(!store.getState().chat.callInProgress||store.getState().chat.callInProgress===2)){
        console.log(data,channel,caller);
        store.dispatch({ type: "INCOMING_VOICE_CALL",payload:{...data,channelId:JSON.parse(payload.data.data).message.channel.id,callerChannel: channel,caller:caller,message_id:JSON.parse(payload.data.data).message.id} })
      }
      store.dispatch({type:"SET_LAST_NOTIFICATION_DATE",payload:(new Date()).toLocaleString()})
      store.dispatch({ type: "REC_CHA", payload: parseInt(JSON.parse(payload.data.data).message.channel.id)})
      if(parseInt(store?.getState()?.chat?.activeChat?.id)===parseInt(JSON.parse(payload.data.data)?.message.channel?.id)){
        store.dispatch({type:"WATCH_CHANNEL",payload:parseInt(JSON.parse(payload.data.data).message?.channel?.id)})
      }else{
        let active=store?.getState()?.chat?.activeChat
        if(active?.id &&active?.channel_members.filter((mem)=>mem.user_id===getUserChat().id && mem.user.mute===1).length>0){
          ;
        }
        else{
        
          let not = new Audio('/wa.mp3');
          not.volume = 0.5
          not.play()
        }
      
      }
      store.dispatch({type:"SEND-MESSAGE",payload:{act:JSON.parse(payload.data.data).message.channel,message:{...JSON.parse(payload.data.data).message,channel:null,message_type:{name:'VoiceCall'},message_status:[]}}})
        
      resolve(payload);
     }
     else if(payload.data.type==="VideoCallEvent"){

      let data=JSON.parse(payload.data.data).payload
      let channel=store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]:{id:JSON.parse(payload.data.data).message.channel.id,messages:[{message_type:{name:'VoiceCall'}}],channel_members:[{user_id:data.user_id,user:store.getState().chat.contacts.filter((s)=>s.contact_user_id===data.user_id)[0],mute:0,pin:0,archived:0},{mute:0,pin:0,archived:0,user_id:getUserChat().id,user:getUserChat()}]}
      let caller = store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId)).length>0?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channelId))[0]?.channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]:{user:{name:data.callerName,photo_path:data.callerPhoto}}
      if(data.user_id!==getUserChat().id&&(!store.getState().chat.callInProgress||store.getState().chat.callInProgress===2)){
      store.dispatch({ type: "INCOMING_CALL",payload:{...data,channelId:JSON.parse(payload.data.data).message.channel.id,callerChannel: channel,caller:caller,message_id:JSON.parse(payload.data.data).message.id} })}
        store.dispatch({type:"SET_LAST_NOTIFICATION_DATE",payload:(new Date()).toLocaleString()})
     store.dispatch({ type: "REC_CHA", payload: parseInt(JSON.parse(payload.data.data).message.channel.id)})
     if(parseInt(store?.getState()?.chat?.activeChat?.id)===parseInt(JSON.parse(payload.data.data)?.message?.channel?.id)){
       store.dispatch({type:"WATCH_CHANNEL",payload:parseInt(JSON.parse(payload.data.data).message?.channel?.id)})
     }else{
       let active=store?.getState()?.chat?.activeChat
       if(active?.id &&active?.channel_members.filter((mem)=>mem.user_id===getUserChat().id && mem.user.mute===1).length>0){
         ;
       }
       else{
       
         let not = new Audio('/wa.mp3');
         not.volume = 0.5
         not.play()
       }
     
     }
     store.dispatch({type:"SEND-MESSAGE",payload:{act:JSON.parse(payload.data.data).message.channel,message:{...JSON.parse(payload.data.data).message,channel:null,message_type:{name:'VideoCall'},message_status:[]}}})
       
     resolve(payload);
    
     }
     else if(payload.data.type==="message"){
      InitPusherChannel(JSON.parse(payload.data.message).channel.id);
      if(store?.getState()?.chat?.data.filter((chat)=>parseInt(chat.id)===parseInt(JSON.parse(payload?.data.message)?.channel?.id))[0]?.messages.filter((message)=>parseInt(message.id)===parseInt(payload.data.prev_message_id)).length>0){
         store.dispatch({type:"SET_LAST_NOTIFICATION_DATE",payload:(new Date()).toLocaleString()})
      store.dispatch({ type: "REC_CHA", payload: parseInt(JSON.parse(payload.data.message).channel.id)})
      if(parseInt(store?.getState()?.chat?.activeChat?.id)===parseInt(JSON.parse(payload?.data.message)?.channel?.id)){
        store.dispatch({type:"WATCH_CHANNEL",payload:parseInt(JSON.parse(payload.data.message)?.channel?.id)})
      }else{
        let active=store?.getState()?.chat?.activeChat
        if(active?.id &&active?.channel_members.filter((mem)=>mem.user_id===getUserChat().id && mem.user.mute===1).length>0){
          ;
        }
        else{
        
          let not = new Audio('/wa.mp3');
          not.volume = 0.5
          not.play()
        }
      
      }
      store.dispatch({type:"SEND-MESSAGE",payload:{act:JSON.parse(payload.data.message).channel,message:{...JSON.parse(payload.data.message),channel:null}}})
        
      resolve(payload);}
      else{
        GetChats(true)
      }}
    });
  });
  