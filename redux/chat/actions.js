import axios from "axios"
import { CHAT_URL, DELETE_CHAT_URL, GET_CHATS_URL, GET_CONTATCS_URL, SEARCH_CONTACTS_URL, SEARCH_USERS_URL, SEND_MESSAGE_URL, SET_CHANNEL_OPT_UTL } from "../../utils/endpointConfig"
import { store } from "../store"
import { getUserChat } from "../../utils/functions"
import { pusher } from "../../utils/constants"


export const ChatConroller =(payload)=>{
    return({type:"CHAT-OPEN",payload:payload})
}
export const GetChats=async (payload) =>{
    try{
      if (!payload){
        store.dispatch({type:"CHAT_LOADING"})
      }
        let resp= await axios.post(CHAT_URL+GET_CHATS_URL,{role_id:116},{
            headers:{
                Authorization:`Bearer `+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
            }
        })
        if (!payload) {
            let channel = pusher.subscribe(`user-${getUserChat()?.id}-messages`);
              channel.bind("ChannelWatchedEvent", (data) => {
                store.dispatch({
                  type: "WATCH_CHANNEL_RED",
                  payload: data.channel_id,
                });
      
              });
               channel.bind("TextMessageEvent", (data) => {
      
                if (data.message.sender_user_id !== getUserChat().id) {
                  let not = new Audio(WA);
                  not.volume = 0.5
                  if(!store.getState().chat.main==="chat")
                  not.play()
                }
                store.dispatch({ type: "REFS" })
                store.dispatch({ type: "REC_CHA", payload: data.message.channel.id })
                if (data.message.sender_user_id !== getUserChat().id) store.dispatch({ type: "SEND_MES_RED", payload: { ...data.message, cid: data.message.channel.id, recive: true } })
              })
               channel.bind("ChannelReceivedEvent", (data) => {
                store.dispatch({ type: "REC_CHANNEL_RED", payload: data.channel_id });
      
              });
              // channel.bind("RefuseCallEvent",(data)=>{
              //   if(store.getState().chat.callInProgress){
              //     store.dispatch({ type: "USER_END_CALL" })
              //   }
              //   else{
              //     store.dispatch({ type: "END-CALL" })
              //   }
              // })
              // channel.bind("VideoCallEvent",async(data)=>{
              //   let channel=store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id))[0]?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id))[0]:{id:data.channel_id,messages:[{message_type:{name:'VoiceCall'}}],channel_members:[{user_id:data.user_id,user:store.getState().chat.contacts.filter((s)=>s.contact_user_id===data.user_id)[0],mute:0,pin:0,archived:0},{mute:0,pin:0,archived:0,user_id:getUserChat().id,user:getUserChat()}]}
              //   let caller = store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id)).length>0?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id))[0].channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]:{user:{name:"ud",photo_path:null}}
              //   if(data.payload.user_id!==getUserChat().id&&(!store.getState().chat.callInProgress||store.getState().chat.callInProgress===2)){
              //   store.dispatch({ type: "INCOMING_CALL",payload:{...data,callerChannel: channel,caller:caller} })}
              // })
              // channel.bind("VoiceCallEvent",async(data)=>{
              //   let channel=store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id))[0]?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id))[0]:{id:data.channel_id,messages:[{message_type:{name:'VoiceCall'}}],channel_members:[{user_id:data.user_id,user:store.getState().chat.contacts.filter((s)=>s.contact_user_id===data.user_id)[0],mute:0,pin:0,archived:0},{mute:0,pin:0,archived:0,user_id:getUserChat().id,user:getUserChat()}]}
              //   let caller = store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id)).length>0?store.getState().chat.data.filter((ch)=>parseInt(ch.id)===parseInt(data.channel_id))[0].channel_members.filter(one => one.user_id !== JSON.parse(localStorage.getItem("USER-CHAT")).id)[0]:{user:{name:"ud",photo_path:null}}
              //   if(data.payload.user_id!==getUserChat().id&&(!store.getState().chat.callInProgress||store.getState().chat.callInProgress===2)){
              //     store.dispatch({ type: "INCOMING_VOICE_CALL",payload:{...data,callerChannel: channel,caller:caller} })
              //   }
              // })
          }
          store.dispatch({ type: "GET_CHAT_RED", payload: resp.data.data.channels,param:resp.data.data.pinned_channels })
          store.dispatch({type:"SET_LAST_NOTIFICATION_DATE",payload:(new Date()).toLocaleString()})
          store.dispatch({ type: "CHAT_DONE" }); 
          let response= await axios.get(CHAT_URL+GET_CONTATCS_URL,{
            headers:{
                Authorization:`Bearer `+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
            }
        })
       store.dispatch({type:"GET_CONTACTS_RED",payload:response.data.data})
    }
    catch(e){

    }
}
export const SendMessage=async (payload,isNew) =>{
    const AxiosInstance = axios.create({
        baseURL:CHAT_URL ,
        timeout: 0,
        headers: {
          Authorization:
            "Bearer " +
            (localStorage.getItem("USER-CHAT") &&
              getUserChat().access_token),
          current_role_id:
            localStorage.getItem("USER-CHAT") &&
              getUserChat().role_id
              ? localStorage.getItem("USER-CHAT") &&
              getUserChat().role_id
              : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
          "Content-Type": "application/json",
        },
      });
      let message = payload;
      try {
        let a = await AxiosInstance.post(
         CHAT_URL +
            SEND_MESSAGE_URL,
          JSON.stringify(message)
        );
        if (a.data.data) {
          if (isNew) {
            store.dispatch({
              type: "SEND_MES_RED_NEW",
              payload: {
                channel: {
                  id:a.data.data.channel_id,
                  messages: [{ ...a.data.data }],
                  mid:isNew
                },
              },
            });
            let ch = pusher.subscribe(
              `presence-typing-${a.data.data.channel.id?.toString(16)}`
            );
            let channel = pusher.subscribe(a.data.data.channel.id?.toString(16));
    
            store.dispatch({
              type: "PUSHER_CH",
              payload: { id: a.data.data.channel.id, channel: ch },
            });
            channel.bind("ChannelWatchedEvent", (data) => {
              store.dispatch({
                type: "WATCH_CHANNEL_RED",
                payload: data.channel_id,
              });
    
            });
            channel.bind("ChannelReceivedEvent", (data) => {
              store.dispatch({ type: "REC_CHANNEL_RED", payload: data.channel_id });
    
            });
            ch.bind("client-TypingEvent", (data) => {
              
              if (
                parseInt(JSON.parse(JSON.stringify(data)).uid) !== getUserChat().id
              )
             {
                store.dispatch({ type: "IS_TYPING_TRUE", payload: JSON.parse(JSON.stringify(data)) });}
            });
            store.dispatch({ type: "PUSHER_RED", payload: { id: a.data.data.channel.id, channel: ch } });
    
          } else{
            store.dispatch({
              type: "SEND_MES_RED",
              payload: {
                ...a.data.data,
                mid:payload.mid,
                cid: payload.cid,
              },
            });}
    
        }
    
      } catch (e) {
        console.error(e);
      }
}
export async function watchChannel(payload) {
  try {
    const AxiosInstance = axios.create({
      baseURL:
      CHAT_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") &&
            getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    await AxiosInstance.get(`/api/v1/channels/${payload}/received`);
    let resp = await AxiosInstance.get(
       CHAT_URL +
        `/api/v1/channels/${payload}/watched`
    );
  } catch (e) { }
}
export async function StartChat(payload) {
  try {
    const AxiosInstance = axios.create({
      baseURL:
        CHAT_URL
          ,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") &&
            getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    store.dispatch({ type: "CHAT_LOADING_USER" });
    const base =CHAT_URL;
    let resp = await AxiosInstance.get(
      base +
      SEARCH_USERS_URL+
      payload
    );
    store.dispatch({ type: "SEARCH_USER_RED", payload: resp.data.data });
    store.dispatch({ type: "CHAT_DONE_USER" });
  } catch (e) {
    store.dispatch({ type: "SEARCH_USER_RED", payload: [] });
  }
}
export async function deleteChat(payload) {
  try {
    const AxiosInstance = axios.create({
      baseURL:
        CHAT_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") &&
            getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    await AxiosInstance.post(
      DELETE_CHAT_URL,
      JSON.stringify({ id: payload })
    );
  } catch (e) {
    console.error(e);
  }
}
export async function Recive(payload) {
  const AxiosInstance = axios.create({
    baseURL:
      CHAT_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") &&
          getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") &&
          getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") &&
          getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
  try {
    await AxiosInstance.get(`/api/v1/channels/${payload}/received`);
  } catch (e) { }
}
export async function getPage(channel,mid) {
  try {
    const AxiosInstance = axios.create({
      baseURL:
         CHAT_URL ,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") &&
            getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    let channel_id = channel
    let res = await AxiosInstance.post(`api/v1/messages/messages_of_channel/${channel_id}?message_id=${mid}&limit=10`)
    store.dispatch({ type: "GRP", payload: { mes: res.data.data, ch: channel_id } })
  }
  catch (e) {

  }

}
export async function SearchContact(payload){
  try{
    const AxiosInstance = axios.create({
      baseURL:
        CHAT_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") &&
            getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    if(payload?.length>0){
    let res=await AxiosInstance.get(SEARCH_CONTACTS_URL+payload);
    store.dispatch({type:"SEARCH_REDUCER",payload:res.data.data})
  }
  }
  catch(e){

  }
}
export async function PinnChat(payload){
  try{
    const AxiosInstance = axios.create({
      baseURL:
         CHAT_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") &&
            getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    await AxiosInstance.post(SET_CHANNEL_OPT_UTL,JSON.stringify({channel_id:payload.id,pin:payload.value?1:0}))
    GetChats(true)
  }catch(e){}
}
export async function MuteChat(payload){
  try{
    const AxiosInstance = axios.create({
      baseURL:
         CHAT_URL,
      timeout: 0,
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("USER-CHAT") &&
            getUserChat().access_token),
        current_role_id:
          localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            ? localStorage.getItem("USER-CHAT") &&
            getUserChat().role_id
            : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
        "Content-Type": "application/json",
      },
    });
    await AxiosInstance.post(SET_CHANNEL_OPT_UTL,JSON.stringify({channel_id:payload.id,mute:payload.value?1:0}))
  }catch(e){}
}
export async function getMessagesBetweenMessage(payload){
  const AxiosInstance = axios.create({
    baseURL:
       CHAT_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") &&
          getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") &&
          getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") &&
          getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
 let res= await AxiosInstance.post(`/api/v1/messages/messages_of_channel/${payload.first}`,JSON.stringify({limit:payload.second+1}))
 store.dispatch({ type: "GRP", payload: { mes: res.data.data, ch: action.payload.first } })
}

export async function getContacts (){
  const AxiosInstance = axios.create({
    baseURL:
       CHAT_URL,
    timeout: 0,
    headers: {
      Authorization:
        "Bearer " +
        (localStorage.getItem("USER-CHAT") &&
          getUserChat().access_token),
      current_role_id:
        localStorage.getItem("USER-CHAT") &&
          getUserChat().role_id
          ? localStorage.getItem("USER-CHAT") &&
          getUserChat().role_id
          : "-1", // Authorization:'Bearer '+"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiM2I4MzY1NzJkNDFmZDgzNTU5ZGU1NjJjNTNhNGY4NTllMzc2NjJkZDBkOWZjNjZmOTk2YzFjM2QyZWY3NWI1ZTFmNGMwZmU2ZGU3ZGYwYjAiLCJpYXQiOjE2Njk0NjQ5NjkuNDI0OTYyLCJuYmYiOjE2Njk0NjQ5NjkuNDI0OTY2LCJleHAiOjE2NzcyNDA5NjkuMjQ5ODU0LCJzdWIiOiIiLCJzY29wZXMiOlsiMSIsIjIiXX0.OAGhSqUNoaEQu5_8iLo_nQys7CahTV9gLnFPuMbvBFn5Tr8dv4rrQ0Pw9Gldec2qn-A6mU-TBEitJmUTcroTA6GO7LgY7igFKpMuIX1xcOJtqDrlyYsrvTxT35HDoI7fXStg4RrkbXEBvtHXCQ4PoRu3XNubc44YJeUwtzr3MPYNhEljtgIgCGhVzpK1Fk4IzMIjFvTVQ1jfzaCtDkdYaFxvxkWdjd9AXDJwqsBcJXW5WuNtAA8H60A50-ZYQMPyUaAwP0N-q45YvEWx3lpOPpoyU_8hiqBLa28VAsHmtvCtRZDJN_rhm4rlexCJnapPbs4ldIXXR_uB7tBWnB0DwzIonXiGHJVf8jaxQQehcyfn0nhgXdrU4LezWEbq2DfNu1V_DIoV0HGrr0GiPYPmj7IuyK0mAsSJJ-MAhO9cQ09EDW9eTXdUwUkWAaeZiTPc3ClFq6tR5Pev_N6nHOkp0jGJb2ND1YUgO6ozqkyrO9vGXld6ALTPu8FndWP8F7Zpfh00luKxuz9gDeR2ONjW0eGb6bUJ_NLlWPp_-G86a2pA2qEOLXkITa9OyrY4wrhAITdLM1JGmeIfaQzdzcqMJUed40_gGwZdbC-IyxN25hBoI8s0O2M7dUZ7jw5__DSxVDA1aePuxNk-0OIJ3xnce--ZEC85Jq0ATw6MLvXnQ34",
      "Content-Type": "application/json",
    },
  });
 let res= await AxiosInstance.get("/api/v1/users/my_contacts")
 store.dispatch({type:"GET_CONTACTS_RED",payload:res.data.data})
}

export async function checkForUpdate(){
  try{
    let last_date=store.getState().chat.lastNotification
    if(last_date && ((new Date()).getTime() - (new Date(last_date)).getTime() ) > 120000  ){
      GetChats(true)
  }
  }catch(e){

  }
}
export const InitPusherChannel=(channelId)=>{
  if(store.getState().chat.channels.filter((ch)=>ch.id===channelId).length===0){
  let ch = pusher.subscribe(`presence-typing-${channelId?.toString(16)}`);
  ch.bind("client-TypingEvent", (data) => {
  
    if (
      parseInt(JSON.parse(JSON.stringify(data)).uid) !== getUserChat().id
    )
    {
      store.dispatch({ type: "IS_TYPING_TRUE", payload: JSON.parse(JSON.stringify(data)) });}
  });  
   store.dispatch({ type: "PUSHER_RED", payload: { id: channelId, channel: ch } });}
}
export const makeVideoCall=async(channelId,callerName,callerPhoto)=>{
  try{
    store.dispatch({type:"CALL-LOADING",payload:'video'})
    let obj=channelId.includes('ch')?{reciver_user_id:channelId.split('ch-')[0]}:{channel_id:channelId}
    await axios.post(CHAT_URL+`/api/v1/messages/video_call`,
    {...obj,payload:{channel_name:'ch-'+channelId,user_id:getUserChat().id,type:"video",channelId:channelId,name:callerName,photo:callerPhoto}},{
      headers:{
          Authorization:`Bearer `+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
      }
  }).then((data)=>{
    console.log(data)
    store.dispatch({type:"VIDEO_CALL",payload:data.data.data.token,source:data.data.data.message})
    store.dispatch({type:"CALL-LOADING",payload:null})
  })  
  }
  catch(e){

  }
}
export const makeVoiceCall=async(channelId,callerName,callerPhoto)=>{
  try{
    let obj=channelId.includes('ch')?{reciver_user_id:channelId.split('ch-')[0]}:{channel_id:channelId}
    store.dispatch({type:"CALL-LOADING",payload:'voice'})
    await axios.post(CHAT_URL+`/api/v1/messages/voice_call`,
    {...obj,payload:{channel_name:'ch-'+channelId,user_id:getUserChat().id,type:"audio",channelId:channelId,name:callerName,photo:callerPhoto}},{
      headers:{
          Authorization:`Bearer `+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
      }
  }).then((data)=>{
    store.dispatch({ type: "AUDIO_CALL",payload:data.data.data.token,source:data.data.data.message })
    store.dispatch({type:"CALL-LOADING",payload:null})
  })
  
  }
  catch(e){

  }
}
export const AnswerCall=async(channelId,messageId)=>{
  try{
    await axios.post(CHAT_URL+`/api/v1/channels/${channelId}/agora_token`,{},{
      headers:{
          Authorization:`Bearer `+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
      }
  }).then((data)=>{
    Answer(channelId,messageId)
    store.dispatch({type:"ANSWER_CALL",payload:data.data.data})
  })
  }
  catch(e){

  }
 
}
export const RefuseCall=async(channelId,messageId)=>{
  try{
    let obj=typeof channelId ==="string"&& channelId.includes('ch')?{reciver_user_id:channelId.split('ch-')[0]}:{channel_id:channelId}

    store.dispatch({ type: "USER_END_CALL" })
    await axios.post(CHAT_URL+`/api/v1/messages/refuse_call/${messageId}`,{...obj},{
      headers:{
          Authorization:`Bearer `+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
      }
  }).then(()=>{
    
  })

  }
  catch(e){
console.error(e)
  }
}
export const Answer=async(channelId,messageId)=>{
  try{
    let obj=typeof channelId ==="string"&&channelId.includes('ch')?{reciver_user_id:channelId.split('ch-')[0]}:{channel_id:channelId}
    store.dispatch({ type: "USER_END_CALL" })
    await axios.post(CHAT_URL+`/api/v1/messages/answer_call/${messageId}`,{...obj},{
      headers:{
          Authorization:`Bearer `+JSON.parse(localStorage.getItem('USER-CHAT')).access_token
      }
  }).then(()=>{
    
  })

  }
  catch(e){

  }
}
export const EstablishChannel=(cg)=>{
   let chs =  pusher.subscribe(`presence-video-call-${cg.pusher_channel_name}`)
               chs.bind(`client-signal-${getUserChat().id}`, (signal) => {
                let caller = cg.channel_members.filter(one => one.user_id !== getUserChat().id)[0]
                let callerChannel = cg
                store.dispatch({
                  type: "INCOMING_CALL", payload: {
                    signal,
                    caller,
                    callerChannel
                  }
                })
              })
               chs.bind(`client-signal-voice-${getUserChat().id}`, (signal) => {
                let caller = cg.channel_members.filter(one => one.user_id !== getUserChat().id)[0]
                let callerChannel = cg
                store.dispatch({
                  type: "INCOMING_VOICE_CALL", payload: {
                    signal,
                    caller,
                    callerChannel
                  }
                })
              })
}