"use client"
import { AdvancedImage } from '@cloudinary/react';
import React, { useEffect } from 'react'

function ImageStory({story,action,isPaused}) {
  return (
   <AdvancedImage onLoad={()=>action('play')} alt="story" cldImg={story.FixedUrl} style={{width:"100%",height:"100%"}}/>
  );
}

export default ImageStory