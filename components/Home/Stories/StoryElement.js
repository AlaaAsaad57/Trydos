import React from 'react'
import StoryAvatar from "./StoryAvatar"
import Story from "./Story"
import { useSelector } from 'react-redux'
function StoryElement() {
  const language=useSelector((state)=>state.homepage.language)
  return (
    <div className='story-element-container' aria-details={language}>
        <StoryAvatar/>
        <Story/>
    </div>
  )
}

export default StoryElement