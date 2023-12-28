"use client"
import React, { useEffect, useState } from 'react'
import {  useSearchParams,useRouter } from 'next/navigation'
import dynamic from "next/dynamic"
const WebViewVideoCall =dynamic(()=>import('./WebViewVideoCall', { ssr: false }))
const WebViewVoiceCall =dynamic(()=>import('./WebViewVoiceCall', { ssr: false }))
const CallComponentWidget =dynamic(()=>import('./CallComponentWidget', { ssr: false }))
import {getAgoraToken,Decline} from './WebViewActions'
import CallingIcon from "../Chat/svg/CallInProg.svg"
function WebviewCall() {
  const router=useRouter()
  const searchParams = useSearchParams()
  const [data,setData]=useState({
    token:searchParams.get('token')?.replaceAll(' ','+'),
    sender_user_id:searchParams.get('uid'),
    channel_id:searchParams.get('ch_id'),
    type:searchParams.get('type'),
    action:searchParams.get('action'),
    actionInit:searchParams.get('action'),
    authToken:searchParams.get('authToken'),
    msgId:searchParams.get('message_id'),
    loading:false
  })
    useEffect(()=>{
      
    },[])
    const onAnswer=async()=>{
      if(!data.loading){
      setData({...data,loading:true})
      let token=await getAgoraToken(data.channel_id,data.authToken,data.msgId,data.action==='receive')
      
      setData({...data,token:token,action:'sent'})}
    }
    const onDecline=async ()=>{
      if(!data.loading){
      setData({...data,loading:true})
      await Decline(data.authToken,data.msgId)
      window.location.href ='/endCall'}
    }
    useEffect(()=>{
      if(!data.token&&data.action==='sent'){
        onAnswer()
      }
    },[])
  return (
    <>
    {!data.token&&<div style={{width:'100vw',height:'100vh',display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",backgroundColor:'#000',color:'#FFF',flexDirection:'column'}}>
      <CallingIcon style={{marginBottom:'10px',transform:'scale(1.5)'}}></CallingIcon>
      Loading Call Information...</div>}
      {data.authToken&&data.action==='receive'&&<CallComponentWidget data={data} onDecline={()=>{onDecline()}} onAnswer={()=>{onAnswer()}} type={data.type}/>}
      {data.authToken&&data.token&&data.action!=='receive'&&data.type==='voice'&&<WebViewVoiceCall onDecline={()=>onDecline()} data={data}/>}
      {data.authToken&&data.token&&data.action!=='receive'&&data.type==='video'&&<WebViewVideoCall  onDecline={()=>onDecline()} data={data}/>}
    </>
  )
}

export default WebviewCall