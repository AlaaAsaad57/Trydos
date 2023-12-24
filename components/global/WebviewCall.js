"use client"
import React, { useEffect, useState } from 'react'
import {  useSearchParams } from 'next/navigation'
import dynamic from "next/dynamic"
const WebViewVideoCall =dynamic(()=>import('./WebViewVideoCall', { ssr: false }))
const WebViewVoiceCall =dynamic(()=>import('./WebViewVoiceCall', { ssr: false }))
function WebviewCall() {
  const searchParams = useSearchParams()
  const [data,setData]=useState({
    token:searchParams.get('token'),
    sender_user_id:searchParams.get('uid'),
    receiver_user_id:searchParams.get('ruid'),
    channel_id:searchParams.get('ch_id'),
    type:searchParams.get('type')
  })
    useEffect(()=>{
        console.log(data)
    },[])
  return (
    <>
      {data.type==='voice'&&<WebViewVoiceCall data={data}/>}
      {data.type==='video'&&<WebViewVideoCall data={data}/>}
    </>
  )
}

export default WebviewCall