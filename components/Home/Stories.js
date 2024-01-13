"use client"
import React, {useEffect, useState } from 'react'
import Stories, { WithSeeMore } from 'react-insta-stories';
import StoryComponent from './StoryComponent';
import { useDispatch, useSelector } from 'react-redux';
import { SelectStory, setNextStory } from 'store/homepage/actions';
import AddStory from './AddStory';
function StoriesBar({stories}) {
    const selectedStory=useSelector(state => state.homepage.selectedStory)
  
    const dispatch=useDispatch()
    const setSelectStory=(e)=>{
        dispatch(SelectStory(e))
    }      
  return (
  <>
    <div className='stories-container'>
        {stories?.map((story,index)=>
            (<StoryComponent key={index}  story={story}  viewedStory={story.stories[0]} select={(e)=>setSelectStory(e)} />)
        )}
        <AddStory/>
    </div>
  </>
  )
}

export default StoriesBar