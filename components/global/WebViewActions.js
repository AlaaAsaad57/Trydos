import axios from "axios"
import { CHAT_URL } from "../../utils/endpointConfig"
import { Answer } from "../../redux/chat/actions"

export const AnswerCall=async (token,mid,chid)=>{
let req= await axios.post(CHAT_URL+`/api/v1/messages/answer_call/${messageId}`,{},{
    headers:{
        Authorization:'Bearer '+token
    }
}).then((data)=>{
    
})
}
export const getAgoraToken =async (channel_id,token,mid,bool,answered)=>{
    let tok, status
    if(answered)
    await Answer(channel_id,mid)
    let req= await axios.post(CHAT_URL+`/api/v1/channels/${channel_id}/agora_token`,{},{
        headers:{
            Authorization:'Bearer '+token
        }
    }).then((data)=>{
        if(bool)
        tok= data.data.data
    })
    if(answered)
    await axios.get(CHAT_URL+`/api/v1/messages/${mid}/users`,{
         headers:{
        Authorization:'Bearer '+token
    }}).then((data)=>{
        status=data.data.data[0].status==='active'
    })
    return [tok,status]
}

export const Decline=async (token,mid)=>{
    let req= await axios.post(CHAT_URL+`/api/v1/messages/refuse_call/${mid}`,{},{
        headers:{
            Authorization:'Bearer '+token
        }
    }).then((data)=>{
        
    })
}