import axios from "axios"
import { CHAT_URL } from "../../utils/endpointConfig"

export const AnswerCall=async (token,mid)=>{
let req= await axios.post(CHAT_URL+`/api/v1/messages/answer_call/${messageId}`,{},{
    headers:{
        Authorization:'Bearer '+token
    }
}).then((data)=>{
  
})
}
export const getAgoraToken =async (channel_id,token)=>{
    let tok
    let req= await axios.post(CHAT_URL+`/api/v1/channels/${channel_id}/agora_token`,{},{
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