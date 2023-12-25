"use client"
import React, { useEffect, useState } from 'react'
import {  useSearchParams,useRouter } from 'next/navigation'
import dynamic from "next/dynamic"
const WebViewVideoCall =dynamic(()=>import('./WebViewVideoCall', { ssr: false }))
const WebViewVoiceCall =dynamic(()=>import('./WebViewVoiceCall', { ssr: false }))
const CallComponentWidget =dynamic(()=>import('./CallComponentWidget', { ssr: false }))
import {getAgoraToken,Decline} from './WebViewActions'
import { SSRDetect } from '../../utils/functions'
function WebviewCall() {
  const router=useRouter()
  const searchParams = useSearchParams()
  const [data,setData]=useState({
    token:searchParams.get('token')?.replaceAll(' ','+'),
    sender_user_id:searchParams.get('uid'),
    channel_id:searchParams.get('ch_id'),
    type:searchParams.get('type'),
    action:searchParams.get('action'),
    authToken:searchParams.get('authToken'),
    msgId:searchParams.get('message_id')
  })
    useEffect(()=>{
        console.log(data)
    },[])
    const onAnswer=async()=>{
      let token=await getAgoraToken(data.channel_id,data.authToken)
      console.log(token)
      setData({...data,token:token,action:'sent'})
    }
    const onDecline=async ()=>{
      await Decline(data.authToken,data.msgId)
      window.location.href ='https://youtube.com'
    }
    useEffect(()=>{
      if(!data.token&&data.action==='sent'){
        onAnswer()
      }
    },[])
  return (
    <>
 <div style={{backgroundColor:"white",position:'absolute',bottom:'0',zIndex:'3000000000',userSelect:'text',opacity:0.5,maxWidth:'100%'}}>{SSRDetect()&& window.location.href}</div>   
      {data.authToken&&data.action==='receive'&&<CallComponentWidget data={data} onDecline={()=>{onDecline()}} onAnswer={()=>{onAnswer()}} type={data.type}/>}
      {data.authToken&&data.token&&data.action!=='receive'&&data.type==='voice'&&<WebViewVoiceCall onDecline={()=>onDecline()} data={data}/>}
      {data.authToken&&data.token&&data.action!=='receive'&&data.type==='video'&&<WebViewVideoCall  onDecline={()=>onDecline()} data={data}/>}
    </>
  )
}

export default WebviewCall