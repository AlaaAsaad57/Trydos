import React from 'react'
import CallComponent from "components/Chat/components/CallComponent"
import Chat from "./index"
import { useDispatch, useSelector } from 'react-redux'
import { ChatConroller } from 'store/chat/actions'
import { requestFirebaseNotificationPermission } from 'utils/firebaseInitv1'
import { SSRDetect, getUserChat } from 'utils/functions'
import { StoreToken } from 'store/auth/actions'
function ChatModal() {
    const isCallIncoming = useSelector(state => state.chat.isCallIncoming)
    const callInProgress=useSelector((state)=>state.chat.callInProgress);
    const chatVar = useSelector(state => state.chat.chatVar)
    const dispatch = useDispatch()
  return (
    <>
          {isCallIncoming && <CallComponent reply={() => dispatch(ChatConroller(true))} />}
          {chatVar&&SSRDetect()&& <Chat open={chatVar} close={() => {
      typeof window !=='undefined'&& 'serviceWorker' in navigator&&  requestFirebaseNotificationPermission()
            .then((firebaseToken) => {
            try {
                  if(!firebaseToken) {
                    toast.error("Please Check Notifications Premissions")
                  }
                  else{    
                    localStorage.setItem("firebase_token",firebaseToken)
                    
                    firebaseToken &&getUserChat()?.id&& StoreToken( {
                      id: getUserChat()?.id,
                      token: firebaseToken,
                      user:getUserChat()
                    });      
                  
                }
                } catch (e) {
            
                }
              
            })
            dispatch(ChatConroller(false));}} callInProgress={callInProgress} />} 
    </>
  )
}

export default ChatModal