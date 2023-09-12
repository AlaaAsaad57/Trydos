import { AdvancedVideo } from '@cloudinary/react'
import React from 'react'

function StoryRenderer({url,action,isPaused}) {
    console.log(url)
  return (
    <div className='story-renderer'>
        <AdvancedVideo cldVid={url}/>
    </div>
  )
}

export default StoryRenderer