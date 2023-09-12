import { myCld } from '@/utils/constants';
import Image from 'next/image'
import React, { useEffect, useRef } from 'react'
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import StoryRenderer from './StoryRenderer';
import { AdvancedVideo } from '@cloudinary/react';
function StoryComponent({story,viewedStory,select}) {
    let vid = myCld.video(viewedStory.full_video_path?.split("/").pop().split(".")[0]).delivery(quality(auto()));
    console.log(vid.toURL())
  return (
    <div className='story-component' onClick={()=>select([{ 
        url:myCld.video(viewedStory.full_video_path?.split("/").pop().split(".")[0]).delivery(quality(auto())).toURL(),
    FixedUrl:myCld.video(viewedStory.full_video_path?.split("/").pop().split(".")[0]).delivery(quality(auto())),
    content: ({ action, isPaused,story }) => {
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
       <AdvancedVideo onEnded={()=>select(null)} ref={ref} muted={false} onPlay={()=>action('play')} onPause={()=>action('pause')} style={{width:"100%",height:"100%"}} autoPlay cldVid={story.FixedUrl}/>
      );
    },
    duration:14000,
    type:"video"
  }])}>
        {viewedStory.full_video_path&&
        <Image width={145} height={255} priority src={viewedStory.full_video_path?.replace(viewedStory.full_video_path?.split('.')[3],'jpg')||viewedStory.photo_path} style={{width:"100%",height:"100%",borderRadius:"10px"}}/>}
    </div>
  )
}

export default StoryComponent