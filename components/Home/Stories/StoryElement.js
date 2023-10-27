import React from 'react'
import StoryAvatar from "./StoryAvatar"
import Story from "./Story"
function StoryElement() {
  return (
    <div className='story-element-container'>
        <StoryAvatar/>
        <Story/>
    </div>
  )
}

export default StoryElement