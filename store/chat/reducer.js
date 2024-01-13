import {  getUser, getUserChat, translate } from "utils/functions"
import { pusher } from "utils/constants";
import { DisablePusher, EnablePusher, MuteChat, PinnChat, Recive, RefuseCall, deleteChat, watchChannel } from "./actions";
import { index } from "../index";

// const sortChats = (arr) => {
//     let l = arr.sort((a, b) => compares(a, b))
//     return l
//   }
//   const compares = (a, b) => {
//     if (parseInt(new Date(a?.messages[0]?.created_at).getTime()) < parseInt(new Date(b?.messages[0]?.created_at).getTime())) {
//       return -1
//     }
//     else {
//       if (a.messages.length === 0 || b.messages.length === 0) {
//         return -1
//       }
//       else {
//         return 1
//       }
//     }
//   }
const initialState = {
    chatVar:false,
    data: [],
    MessageActiveCall:null,
    activeChat: null,
    main: "main",
    loading: true,
    refs: false,
    contacts:[],
    channels: [],
    users: [],
    qouted:null,
    pusher_channels:[],
    SearchEnable: false,
    user_loading: false,
    fbToken:null,
    newChats: [],
    openChat:null,
    pinnedChats:[],
    date: "Today",
    chatUsers: [],
    call: null,
    fetch: true,
    first:false,
    mid:null,
    ref: false,
    isCallIncoming: false,
    incomeCallData: null,
    incomeCallType: null,
    caller: [],
    callerChannel: null,
    callInProgress: false,
    pinnedChats:[],
    isReachTheFinalMes: false,
    replyMessage:null,
    forwarded_message:null,
    calls:[{from:{name:"Grant Marshall",avatar:null},created_at:new Date(),type:"incoming"},{from:{name:"Grant Marshall",avatar:null},created_at:new Date(),type:"missed"},{from:{name:"Grant Marshall",avatar:null},created_at:new Date(),type:"outgoing"}],
    searchResults:[],
    lastNotification:null,
    callLoading:null,
    AgoraToken:null
}
const showDate = (d) => {
    const language=index.getState().homepage.language;
    var days = [translate('Sunday',language), translate('Monday',language), translate('Tuesday',language), translate('Wednesday',language), translate('Thursday',language), translate('Friday',language), translate('Saturday',language)];
    let now = new Date();
    let nowString = `${now.getFullYear()}-${(now.getMonth() + 1) > 9 ? (now.getMonth() + 1).toString() : ("0" + (now.getMonth() + 1).toString())}-${(now.getDate()) > 9 ? now.getDate() : "0" + parseInt(now.getDate()).toString()}`

    let day = new Date(d)
    day = days[day.getDay()]
    if (d === nowString)
        return (translate("Today",language))
    else if ((new Date(nowString) - new Date(d)) === 86400000) {
        return (translate("Yesterday",language))
    }
    else if ((new Date(nowString) - new Date(d)) < (86400000 * 6))
        return (day)
    else
    return (language==='ar'?d.toLocaleString('ar-EG'):d)
}
export const ChatReducer = (state = initialState, { type, payload ,param,source}) => {
    switch (type) {
        case "CALL-LOADING":{
            return({
                ...state,
                callLoading:payload
            })
        }
        case "CHAT-OPEN":{
            if(payload){EnablePusher()}
            else {DisablePusher()}
            return({
                ...state,
                chatVar:payload
            })
        }
        case "SET_LAST_NOTIFICATION_DATE":{
            return({
                ...state,
                lastNotification:payload
            })
        }
        case "GET_CONTACTS_RED":{
            return({
                ...state,
                contacts:payload
            })
        }
        case "SEARCH_REDUCER":{
            return{
                ...state,
                searchResults:payload
            }
        }
        case "FORWARD-MESSAGEs":{
            return{...state,forwarded_message:payload,main:"MAIN"}
        }
        case "log_out":{
            return initialState
          }
        case "USER_END_CALL": {
            if(state.activeChat)
            return ({
                ...state,
                callInProgress: 2,
            })
            else{
                return({
                    ...state,
                    call: null,
                    callInProgress: false,
                    incomeCallType:null,
                    incomeCallData:null,
                    callLoading:null,
                    isCallIncoming: false,
                    MessageActiveCall:null
                })
            }
        }
        case "ME_END_CALL": {
            if(state.activeChat)
            return ({
                ...state,
                callInProgress: 2,
                
            })
            else{
                return({
                    ...state,
                    call: null,
                    callInProgress: false,
                    isCallIncoming: false,
                    incomeCallType:null,
                    incomeCallData:null,
                    callLoading:null,
                    
                })
            }
        }
        case 'END-CALL':{
            return{
                ...state,
                call: null,
                callInProgress: false,
                isCallIncoming: false,
                callLoading:payload,
                incomeCallData:null,
                incomeCallType:null,
                caller:null,
                callerChannel:null
            }
        }
        case "VIDEO_CALL": {
            let newActive={...state.activeChat,messages:[...state.activeChat.messages,{...source,message_type:{name:'VideoCall'}}],id:source.channel.id}
            let arr=[];
            if( state.data.filter((m)=>parseInt(m.id)===parseInt(source.channel.id)).length===0){
                arr.push(newActive)
            }
            state.data.map((m)=>{if(parseInt(m.id)===parseInt(source.channel.id)){arr.push(newActive)}else{arr.push(m)}})
            return ({
                ...state,
                activeChat:newActive,
                call: "vid-outgoing",
                callInProgress: true,
                data:arr,
                AgoraToken:payload,
                MessageActiveCall:source.id,
                
            })
        }
        case "AUDIO_CALL": {
            let newActive={...state.activeChat,messages:[...state.activeChat.messages,{...source,message_type:{name:'VideoCall'}}],id:source.channel.id}
            let arr=[];
            if( state.data.filter((m)=>parseInt(m.id)===parseInt(source.channel.id)).length===0){
                arr.push(newActive)
            }
            state.data.map((m)=>{if(parseInt(m.id)===parseInt(source.channel.id)){arr.push(newActive)}else{arr.push(m)}})
            return ({
                ...state,
                call: "aud-outgoing",
                data:arr,
                callInProgress: true,
                activeChat:newActive,
                AgoraToken:payload,
                MessageActiveCall:source.id
            })
        }
        case "REFUSE_CALL": {
            return ({
                ...state,
                call: false,
                isCallIncoming: false,
                incomeCallType:null,
                incomeCallData: null,
                caller: null,
                callerChannel: null,
                
            })
        }
        case "ANSWER_CALL": {
            if (state.incomeCallType === "audio") {
                return ({
                    ...state,
                    call: "aud-incoming",
                    activeChat: { ...state.callerChannel },
                    data:state.data.filter((s)=>parseInt(s.id)===parseInt(state.callerChannel.id)).length===0?[state.callerChannel,...state.data]:state.data,
                    main: 'chat',
                    data:[state.callerChannel,...state.data],
                    isCallIncoming: false,
                    callInProgress: true,
                    AgoraToken:payload
                })
            } else {
                return ({
                    ...state,
                    call: "vid-incoming",
                    activeChat: { ...state.callerChannel },
                    data:state.data.filter((s)=>parseInt(s.id)===parseInt(state.callerChannel.id)).length===0?[state.callerChannel,...state.data]:state.data,
                    main: 'chat',
                    isCallIncoming: false,
                    callInProgress: true,
                    AgoraToken:payload
                })
            }

        }
        case "INCOMING_VOICE_CALL": {
             {if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log('sds')
                return ({
                    ...state,
                    isCallIncoming: true,
                    MessageActiveCall:payload.message_id,
                    incomeCallData: payload,
                    caller: payload.caller,
                    callerChannel: payload.callerChannel,
                    incomeCallType: "audio"
                })
            }
        }
        case "INCOMING_CALL": {
             {
                return ({
                    ...state,
                    isCallIncoming: true,
                    incomeCallData: payload,
                    MessageActiveCall:payload.message_id,
                    caller: payload.caller,
                    callerChannel: payload.callerChannel,
                    incomeCallType: "video"
                })
            }
        }
        case "CALL": {
            let pa = null
            if (payload) {
                pa = state.data.filter((s) => s.pusher_channel_name === payload.channel)[0]

            }
            return ({
                ...state,
                call: pa
            })
        }
        case "PUSHER_CHANNEL":{
           let  arr=state.pusher_channels
            if(state.pusher_channels.filter((s)=>s.id===payload.id).length===0){
                arr.push(payload)
            }
            return({
                ...state,
                pusher_channels:arr
            })
        }
        case "PUSHER_CH": {
            return ({
                ...state,
                channels: [...state.channels, payload]
            })
        }
        case "SEARCH_CHAT": {
            return ({
                ...state,
                SearchEnable: payload
            })
        }
        case "CONV_DATWE": {
            let mesDate = new Date(payload)
            mesDate = `${mesDate.getFullYear()}-${(mesDate.getMonth() + 1) > 9 ? (mesDate.getMonth() + 1).toString() : ("0" + (mesDate.getMonth() + 1).toString())}-${(mesDate.getDate()) > 9 ? mesDate.getDate() : "0" + parseInt(mesDate.getDate()).toString()}`
            return ({
                ...state,
                date: showDate(mesDate)
            })
        }
        case "SEND_MES_RED_NEW": {
            return ({
                ...state,
                activeChat: state.activeChat.id===payload.channel.mid?{...state.activeChat,...payload.channel}:state.activeChat,
                data: [{...state.data.filter((c)=>c.id===payload.channel.mid)[0],...payload.channel}, ...state.data.filter((c)=>c.id!==payload.channel.mid)],
                main: "chat",
                ref: !state.ref
            })
        }
        case "CHAT_LOADING_USER": {
            return ({
                ...state,
                user_loading: true
            })
        }
        case "CHAT_DONE_USER": {
            return ({
                ...state,
                user_loading: false
            })
        }
        case "SEARCH_USER_RED": {
            return ({
                ...state,
                users: payload
            })
        }
        case "PUSHER_RED": {
           
            return ({
                ...state,
                channels: [...state.channels,payload]
            })
        }
        case "REFS": {
            return ({ 
                ...state,
                refs: !state.refs,
                ref:!state.ref
            })
        }
        case "IS_TYPING_TRUE": {

            let id = payload.id
            let uid = payload.uid
            let active = null
            let chs = []
            
            if (parseInt(uid) !== parseInt(localStorage.getItem("USER-CHAT") && getUserChat()?.id)) {
                state.data.map((ch) => {
                    if (parseInt(ch.id) === parseInt(id))
                        chs.push({ ...ch, status: payload.desc })
                    else chs.push(ch)
                })
                if (state.activeChat && state.activeChat.id) {
                    active = { ...state.activeChat, status: payload.desc }
                }
                return ({
                    ...state,
                    data: [...chs],
                    activeChat: active

                })
            }
            else
                return ({
                    ...state
                })
        }
        case "WATCH_CHANNEL_RED": {
            let id = parseInt(payload)
            let newChats = []
            let active = null
            state.data.map((a) => {
                if (parseInt(a.id) === id) {
                    let m = []
                    a.messages.map((mes) => {
                        let newst = []
                        let st = mes.message_status
                        if(mes.sender_user_id&&!mes.message_type.name.includes('Call'))
                        st.map((sta) => {
                            let newdate = new Date(new Date().getTime()-(3*60*60*1000))
                            if (sta.user_id !== getUserChat()?.id) {
                                newst.push({ ...sta, is_watched: true, watched_at: sta.watched_at ? sta.watched_at : newdate.toLocaleString().toString() })
                            }
                            else {
                                if (sta.watched_at)
                                    newst.push({ ...sta, is_watched: true, is_received: 1 })
                                else
                                    newst.push({ ...sta, is_watched: true, is_received: 1, watched_at: new Date(new Date().getTime()-(3*60*60*1000)).toLocaleString().toString() })

                            }
                        })
                        if(mes.sender_user_id!==getUserChat()?.id) newst=mes.message_status
                        m.push({ ...mes, message_status: newst })
                    })
                    newChats.push({ ...a, messages: m })
                    if (state.activeChat && state.activeChat.id) {
                        active = state.activeChat
                        if (parseInt(active.id) === parseInt(payload)) {
                            active = { ...a, messages: m }
                        }
                    }
                }
                else {
                    newChats.push(a)
                }
            })
            return ({
                ...state,
                data: newChats,
                activeChat: active,
                newChats: state.newChats.filter((a) => parseInt(a.id) !== payload)
            })
        }
        case "WATCH_CHANNEL":{
            watchChannel(payload)
            let id = parseInt(payload)
            let newChats = []
            let active = null
            if(state.data.filter((s)=>parseInt(s.id)===parseInt(id)).length>0){
                state.data.map((a) => {
                    if (parseInt(a.id) === id) {
                        let m = []
                        a.messages.map((mes) => {
                            let newst = []
                            let st = mes.message_status
                            if(mes.sender_user_id&&!mes.message_type.name.includes('Call'))
                            st.map((sta) => {
                                let newdate = new Date(new Date().getTime()-(3*60*60*1000)).toLocaleString().toString()
                                if (sta.user_id !== getUserChat()?.id) {
                                    newst.push({ ...sta, is_watched: true, watched_at: sta.watched_at ? sta.watched_at : newdate.toLocaleString().toString() })
                                }
                                else {
                                    if (sta.watched_at)
                                        newst.push({ ...sta, is_watched: true, is_received: 1 })
                                    else
                                        newst.push({ ...sta, is_watched: true, is_received: 1, watched_at: new Date(new Date().getTime()-(3*60*60*1000)).toLocaleString().toString() })
    
                                }
                            })
                            if(mes.sender_user_id===getUserChat()?.id&&!mes.message_type.name.includes('Call')) newst=mes.message_status
                            m.push({ ...mes, message_status: newst })
                        })
                        newChats.push({ ...a, messages: m })
                        if (state.activeChat && state.activeChat.id) {
                            active = state.activeChat
                            if (parseInt(active.id) === parseInt(payload)) {
                                active = { ...a, messages: m }
                            }
                        }
                    }
                    else {
                        newChats.push(a)
                    }
                })
                return ({
                    ...state,
                    data: newChats,
                    activeChat: active,
                    newChats: state.newChats.filter((a) => parseInt(a.id) !== parseInt(payload))
                })
            }  
        }
        case "REC_CHANNEL_RED": {
            Recive(payload)
            let id = parseInt(payload)
            let newChats = []
            let active = null
            state.data.map((a) => {
                if (parseInt(a.id) === id) {
                    let m = []
                    a.messages.map((mes) => {
                        let newst = []
                        let st = mes.message_status
                        if(mes.sender_user_id&&!mes.message_type.name.includes('Call'))
                        st.map((sta) => {
                            let newdate =new Date(new Date().getTime()-(3*60*60*1000))
                            if (sta.user_id !== getUserChat()?.id) {
                                newst.push({ ...sta, is_received: 1, received_at: sta.received_at ? sta.received_at : newdate.toLocaleString().toString() })
                            }
                            else {
                                if (sta.received_at)
                                    newst.push({ ...sta, is_received: 1 })
                                else
                                    newst.push({ ...sta, is_received: 1, received_at: new Date(new Date().getTime()-(3*60*60*1000)).toLocaleString().toString() })

                            }
                        })
                        m.push({ ...mes, message_status: newst })
                    })
                    newChats.push({ ...a, messages: m })
                    if (state.activeChat && state.activeChat.id) {
                        active = state.activeChat
                        if (active.id === payload) {
                            active = { ...a, messages: m }
                        }
                    }
                }
                else {
                    newChats.push(a)
                }
            })
            return ({
                ...state,
                data: newChats,
                activeChat: active,
                newChats: [...state.newChats]
            })
        }
        case "OPEN-CHAT": {
            if (payload && payload.id&&!(typeof payload.id === 'string'&&payload.id?.includes('ch'))) {
                let s = state.newChats.filter((a) => a.id !== payload.id)
                return ({
                    ...state,
                    activeChat: state.data.filter((a) => a.id === payload.id).length > 0 ? state.data.filter((a) => a.id === payload.id)[0] : payload,
                    newChats: [...s],
                    openChat:Math.random()
                })
            }
            else {
                return ({
                    ...state,
                    activeChat: payload,
                    newChats: state.newChats,
                    fetch: true,
                    first:true,
                    mid:null
                })
            }
        }
        case "SEND-MESSAGE": {
            let ac = payload.act;
            
            let chat = state.data
            let arr = []
            if(payload.isNew){
                if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log('new')
                    arr.push({...payload.act,messages:[...ac.messages,payload.message]})
                   arr=[...arr,...chat];
                return ({
                    ...state,
                    data: arr,
                    activeChat:state.activeChat&& (state.activeChat?.id) === (ac.id)
                    ? arr.filter((t) => (t.id === state.activeChat?.id))[0]
                     : state.activeChat,
                    ref: !state.ref,
                    refs: !state.refs,
                    replyMessage:null
    
                })
            }
            else{
            chat.map((a) => {
                if (parseInt(a.id) === parseInt(ac.id) && a.messages.filter((m)=>m.id&&(parseInt(m?.id)===parseInt(payload.message?.id))).length===0) {
                    a.messages.push(payload.message)
                }
            })
          
            chat.map((a) => {
                if (parseInt(a.id) === parseInt(ac.id)) {
                    arr.push(a)
                }
            })
            chat.map((a) => {
                if (parseInt(a.id) !== parseInt(ac.id)) {
                    arr.push(a)
                }
            })
            return ({
                ...state,
                data: arr,
                activeChat:state.activeChat&&parseInt(state.activeChat?.id) === parseInt(ac.id)
                ? arr.filter((t) => (parseInt(t.id) === parseInt(state.activeChat?.id)) || (t.mid === state.activeChat?.mid))[0]
                 : state.activeChat,
                ref: !state.ref,
                refs: !state.refs,
                replyMessage:null

            })}
        }
        case "SEND_MES_RED": {
            let ac = payload.cid;

            let chat = state.data
            let act = null
            let chatData = []


            chat.map((a) => {
                if (a.id === ac) {
                    let mar = []
                    let sele = a.messages
                    sele.map((m) => {
                        if (m.mid && m.mid === payload.mid&&mar.filter((S)=>S.id===payload.id).length===0) {
                            mar.push({...payload,message_status:m.message_status,mid:null})
                        }
                        else {
                            mar.push(m)
                        }
                    })
                    if (payload.recive && payload.sender_user_id !== getUserChat()?.id&&mar.filter((S)=>S.id===payload.id).length===0) {
                        mar.push({...payload,mid:null})
                    }
                    chatData.push({ ...a, messages: [...mar] })
                }
                else {
                    chatData.push(a)
                }
            })
            if (state.activeChat && state.activeChat.id && state.activeChat.id === ac) {
                act = chatData.filter((a) => a.id === ac)[0]
            }

            else {
                if (state.activeChat && state.activeChat.id) {
                    act = state.activeChat
                }
            }
            let arr = []
            chatData.map((a) => {
                if (a.id === ac) {
                    arr.push(a)
                }
            })
            chatData.map((a) => {
                if (a.id !== ac) {
                    arr.push(a)
                }
            })
            let news = []
            if (payload.recive && state.activeChat && state.activeChat && payload.cid !== state.activeChat.id) {
                if (state.newChats.filter((a) => a.id === payload.cid).length === 0)
                    news = [...state.newChats, state.data.filter((f) => f.id === payload.cid)[0]]
                else
                    if (!state.activeChat && !state.activeChat.id && payload.recive)
                        news = [...state.newChats, state.data.filter((f) => f.id === payload.cid)[0]]
            }
            if (state.activeChat && state.activeChat.id) {

            }
            else {

                news = [...state.newChats, state.data.filter((f) => f.id === payload.cid)[0]]
            }
            
            return ({
                ...state,
                data: [...arr],
                activeChat:act? { ...act }:null,
                newChats: [...news],
                ref: !state.ref,
                refs: !state.refs
            })
        }
        case "MAIN": {
            
            return ({
                ...state,
                main: payload
            })
        }
        case "STORE_TOKEN_RED":{
            return({
                ...state,
                fbToken:payload
            })
        }
        case "GET_CHAT_RED": {
            let arr = []
            let chatData = []
            let users = []
            let prr=[]
            payload.map((a) => {
                let unique = a.channel_members.filter((df) => df.user_id !== (getUserChat()?.id))[0]
                users.push(unique.user_id)
                chatData.push({ ...a, messages: a.messages.reverse() })
            })
            let temp = state.activeChat
            if (state.activeChat && state.activeChat.id && payload.filter((a) => a.id === state.activeChat.id).length > 0) {
                temp = payload.filter((a) => a.id === state.activeChat.id)[0]
            }
            if (state.data.length !== payload.length) {

                payload.map((adsd) => {
                    if (state.data.filter((ch) => ch.id === adsd.id).length === 0) {
                        if (adsd.messages.filter((mes) => mes.message_status.filter((st) => st.user_id === getUserChat()?.id)[0]?.is_watched === false).length > 0)
                            arr.push(adsd)
                    }
                })
            }
            param.map((p)=>{
                prr.push({...p,messages:p.messages.reverse()})
            })
            return ({
                ...state,
                data: [...prr,...chatData],
                activeChat: temp?.id?{ ...temp }:null,
                newChats: arr,
                chatUsers: users,
                loading:true
            })
        }
        case "CHAT_LOADING": {
            return ({
                ...state,
                loading: true
            })
        }
        case "CHAT_DONE": {
            return ({
                ...state,
                loading: false
            })
        }
        case "DEL_CHAT": {
            return ({
                ...state,
                data: state.data.filter((a) => a.id !== payload)
            })
        }
        case "qouted":{
            return({
                ...state,
                qouted:payload
            })
        }
        case "GRP": {
            let arr = []
            let active = state.activeChat
           
            state.data.map((ch) => {
                if (parseInt(ch.id) === parseInt(payload.ch)) {
                    let mrr = []
                    payload.mes.map((m) => {
                        if (mrr.filter((s) => s.id === m.id).length === 0) {
                            mrr = [m, ...mrr]
                        }
                    })
                    ch.messages.map((m) => {
                        if (mrr.filter((s) => s.id === m.id).length === 0) {
                            mrr.push(m)
                        }
                    })
                    arr.push({ ...ch, messages: mrr })
                }
                else {
                    arr.push(ch)
                }
            })
            return ({
                ...state,
                data: arr,
                activeChat: arr.filter((s) => parseInt(s.id) === parseInt(state.activeChat.id))[0],
                fetch: true,
                first:false,
                mid:payload.mes.length===0?null:state.mid
            })
        }

        case "GET_CHAT_PAGE": {
            return ({
                ...state,
                fetch: false,
                mid:payload
            })
        }
        case "MUTE_CHAT_REDUCER":{
            MuteChat(payload)
            let arr=[]
            state.data.map((chat)=>{
                if(chat.id===payload.id){
                    arr.push({...state.data.filter((s)=>s.id===payload.id)[0],channel_members:[state.data.filter((s)=>s.id===payload.id)[0]?.channel_members.filter((mem)=>mem.user_id!==getUserChat()?.id)[0],{...state.data.filter((s)=>s.id===payload.id)[0]?.channel_members.filter((mem)=>mem.user_id===getUserChat()?.id)[0],mute:payload.value?1:0}]})
                }
                else{
                    arr.push(chat)
                }
            })
   
        
        return({
            ...state,
            data:arr
        })
    }
        case "PIN_CHAT_REDUCER":{
            PinnChat(payload)
            let arr=[]
                arr=[...state.data.filter((s)=>s.id!==payload.id), {...state.data.filter((s)=>s.id===payload.id)[0],channel_members:[state.data.filter((s)=>s.id===payload.id)[0]?.channel_members.filter((mem)=>mem.user_id!==getUserChat()?.id)[0],{...state.data.filter((s)=>s.id===payload.id)[0]?.channel_members.filter((mem)=>mem.user_id===getUserChat()?.id)[0],pin:payload.value?1:0}]}]
            return({
                ...state,
                data:arr
            })
        }
        case "UNREAD_CHAT_REDUCER":{
            
            let arr=[]
            state.data.map((chat)=>{
                if(chat.id===payload.id){
                    arr.push({...chat,unread:payload.value})
                }
                else arr.push(chat)
            })
            return({
                ...state,
                data:arr
            })
        }
        case "DELETE_CHAT_REDUCER":{
            deleteChat(payload.id)
            return({
                ...state,
                data:state.data.filter((chat)=>chat.id!==payload.id)
            })
        }
        case "REPLY-MESSAGE":{
            return({
                ...state,
                replyMessage:payload
            })
        }
        default:
            return state
    }
}
