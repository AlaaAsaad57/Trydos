"use client"
import { AdvancedVideo } from '@cloudinary/react'
import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

function VideoStory({isPaused,action,story}) {
    const dispatch=useDispatch()
    let ref=useRef(null)
    useEffect(()=>{
        if(isPaused){
            ref.current.videoRef.current?.pause()
        }
        else{
            ref.current.videoRef.current?.play()
        }
    },[isPaused])
  return (
   <AdvancedVideo  ref={ref} muted={false} onPlay={()=>action('play')} onPause={()=>action('pause')} style={{width:"100%",height:"100%"}} autoPlay cldVid={story.FixedUrl}/>
  );
}

export default VideoStory