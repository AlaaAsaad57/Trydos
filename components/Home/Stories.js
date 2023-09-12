"use client"
import React, {useEffect, useState } from 'react'
import Stories, { WithSeeMore } from 'react-insta-stories';
import StoryComponent from './StoryComponent';
import { AdvancedVideo } from '@cloudinary/react';
import { useDispatch, useSelector } from 'react-redux';
import { SelectStory } from '@/redux/homepage/actions';
function StoriesBar({stories}) {
    const selectedStory=useSelector(state => state.homepage.selectedStory)
    const dispatch=useDispatch()
    const setSelectStory=(e)=>{
        dispatch(SelectStory(e))
    }
    const image = {
        display: "block",
        maxWidth: "100%",
        borderRadius: 4,
      };
      
      const code = {
        background: "#eee",
        padding: "5px 10px",
        borderRadius: "4px",
        color: "#333",
      };
      
      const contentStyle = {
        background: "#333",
        width: "100%",
        padding: 20,
        color: "white",
        height: "100%",
      };
      
      const customSeeMore = {
        textAlign: "center",
        fontSize: 14,
        bottom: 20,
        position: "relative",
      };
  return (
  <>
{selectedStory&&
    <div style={{position:"fixed",left:"0px",top:"0px"}}>
        <Stories key={1}  preloadCount={3}
			stories={selectedStory}
            storyContainerStyles={{width:"100%",height:"100%"}}
            storyStyles={{width:"100wv",height:"100vh"}}
			defaultInterval={5000}
			width={'100vw'}
			height={'100vh'}
            onAllStoriesEnd={()=>setSelectStory(null)}
		/>
    </div>  }
    <div className='stories-container'>
        {stories.map((story)=>
            (<StoryComponent  story={story.stories}  viewedStory={story.stories[0]} select={(e)=>setSelectStory(e)} />)
        )}
    </div>
  </>
  )
}

export default StoriesBar