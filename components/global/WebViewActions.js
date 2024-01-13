import axios from "axios"
import { CHAT_URL } from "utils/endpointConfig"
import { Answer } from "store/chat/actions"

export const AnswerCall=async (token,mid,chid)=>{
let req= await axios.post(CHAT_URL+`/api/v1/messages/answer_call/${messageId}`,{},{
    headers:{
        Authorization:'Bearer '+token
    }
}).then((data)=>{
    
})
}
export const getAgoraToken =async (channel_id,token,mid)=>{
    let tok, status,req
     req= await axios.post(CHAT_URL+`/api/v1/channels/${channel_id}/agora_token`,{},{
        headers:{
            Authorization:'Bearer '+token
        }
    }).then((data)=>{
        tok= data.data.data
    })
    await axios.get(CHAT_URL+`/api/v1/messages/${mid}/users`,{
         headers:{
        Authorization:'Bearer '+token
    }}).then((data)=>{
       status=data.data.data.length>0
    //    alert(JSON.stringify(data.data.data))
    })
    if(!status)
    await AnswerWebView(token,mid);
    return [tok,status]
}
export const getAgoraTokenForInit=async(channel_id,token,mid)=>{
    let tok,req
    req= await axios.post(CHAT_URL+`/api/v1/channels/${channel_id}/agora_token`,{},{
       headers:{
           Authorization:'Bearer '+token
       }
   }).then((data)=>{
       tok= data.data.data
   })
   return tok
}
export const Decline=async (token,mid)=>{
    let req= await axios.post(CHAT_URL+`/api/v1/messages/refuse_call/${mid}`,{},{
        headers:{
            Authorization:'Bearer '+token
        }
    }).then((data)=>{
        
    })
}
export const AnswerWebView=async(token,messageId)=>{
    try{
      await axios.post(CHAT_URL+`/api/v1/messages/answer_call/${messageId}`,{},{
        headers:{
            Authorization:`Bearer `+token
        }
    }).then(()=>{
      
    })
  
    }
    catch(e){
  
    }
  }