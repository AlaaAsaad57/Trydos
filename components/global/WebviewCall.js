"use client"
import React, { useEffect, useState } from 'react'
import {  useSearchParams,useRouter } from 'next/navigation'
import dynamic from "next/dynamic"
const WebViewVideoCall =dynamic(()=>import('./WebViewVideoCall', { ssr: false }))
const WebViewVoiceCall =dynamic(()=>import('./WebViewVoiceCall', { ssr: false }))
const CallComponentWidget =dynamic(()=>import('./CallComponentWidget', { ssr: false }))
import {getAgoraToken,Decline, getAgoraTokenForInit} from './WebViewActions'
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
    ring:searchParams.get('ring'),
    loading:false,
    status:null
  })
    useEffect(()=>{
      
    },[])
    const onAnswer=async(bool)=>{
   try {
    if(!data.loading){
      setData({...data,loading:true})
      let [token,status]=await getAgoraToken(data.channel_id,data.authToken,data.msgId)
      

      if(status){
        window.location.href=`/callInProg`;
      }
      else {
      setData({...data,token:token,action:'sent'})
      window.location.href = `/call_direct?authToken=${data.authToken}&token=${token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}`
    }

    }
   } catch (error) {
    setData({...data,error:error.message})
   }
    }
    const initCall=async()=>{
      if(!data.loading){
      setData({...data,loading:true})
      let token=await getAgoraTokenForInit(data.channel_id,data.authToken,data.msgId)
      
      setData({...data,token:token,action:'sent'})
      window.location.href = `/call_direct?authToken=${data.authToken}&token=${token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}`
      }
    }
    const onDecline=async ()=>{
      if(!data.loading){
      setData({...data,loading:true})
      await Decline(data.authToken,data.msgId)
      window.location.href ='/endCall'}
    }
    useEffect(()=>{
      if(!data.token&&data.token!=='undefined'&&data.action==='sent'){
        initCall()
      }
    },[])
  return (
    <>
        {/* <div className='error' style={{display:'flex',justifyContent:"flex-start",padding:'10px',flexDirection:"column",maxWidth:'100%',zIndex:'99999',position:"absolute",backgroundColor:'white',opacity:'0.6'}}>  
     <span>url:{window.location.href}</span>
     <span>error:{data.error}</span>
     <span>mesgID:{data.msgId}</span>
      </div>  */}
    {!data.token&&
    <div style={{width:'100vw',height:'100vh',display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",backgroundColor:'#000',color:'#FFF',flexDirection:'column'}}>

      <CallingIcon style={{marginBottom:'10px',transform:'scale(1.5)'}}></CallingIcon>
      Loading Call Information...</div>}
      {data.authToken&&data.action==='receive'&&<CallComponentWidget data={data} onDecline={()=>{onDecline()}} onAnswer={()=>{onAnswer(true)}} type={data.type}/>}
      {data.authToken&&data.token&&data.action!=='receive'&&data.type==='voice'&&<WebViewVoiceCall onDecline={()=>onDecline()} data={data} urlparam={`/call_direct?authToken=${data.authToken}&token=${data.token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}`}/>}
      {data.authToken&&data.token&&data.action!=='receive'&&data.type==='video'&&<WebViewVideoCall  onDecline={()=>onDecline()} data={data} urlparam={`/call_direct?authToken=${data.authToken}&token=${data.token}&action=sent&type=${data.type}&message_id=${data.msgId}&uid=${data.sender_user_id}&ch_id=${data.channel_id}`}/>}

    </>
  )
}

export default WebviewCall