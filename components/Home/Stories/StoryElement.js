import React, { useState } from 'react'
import StoryAvatar from "./StoryAvatar"
import Story from "./Story"

import { useDispatch, useSelector } from 'react-redux'
import { configureStory } from '../../../utils/functions'

function StoryElement({story,viewedStory,select}) {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <div className='story-element-container' aria-details={language}>

        <StoryAvatar avatar={story.avatar}/>
        <Story media={story.stories[0]} Name={story.name} onClick={()=>select(configureStory(story))}/>
    </div>
  )
}

export default StoryElement