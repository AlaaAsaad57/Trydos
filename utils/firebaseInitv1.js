import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {store} from '../redux/store';
import { getUserChat } from './functions';
import { GetChats } from '../redux/chat/actions';

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
      console.log(payload,store?.getState()?.chat?.data.filter((chat)=>parseInt(chat.id)===parseInt(JSON.parse(payload?.data.message)?.channel?.id))[0])
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
        console.log(payload);
      resolve(payload);}
      else{
        GetChats(true)
      }
    });
  });