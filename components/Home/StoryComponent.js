
import Image from 'next/image'
import React, { useState } from 'react'
import { configureStory, getThumb } from 'utils/functions';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import Stories from 'react-insta-stories';
import { useDispatch, useSelector } from 'react-redux';
import { setNextStory, setPreviousStory } from 'store/homepage/actions';
import { AdvancedImage } from '@cloudinary/react';
import 'styles/skeleton.css'
function StoryComponent({story,viewedStory,select}) {
    const [currentStoryId,setCurrentStoryId]=useState(0)
    const selectedStory=useSelector(state => state.homepage.selectedStory)
    const dispatch=useDispatch()
  return (
    <div className='story-component' onClick={()=>select(configureStory(story))}>
      {selectedStory?.id===story.id&&
    <div className='fixed-layout' style={{position:"fixed",left:"0px",top:"0px",zIndex:"100"}} key={selectedStory.id}>
        <Stories  key={story.id.id} 
            preloadCount={3}
            currentIndex={currentStoryId}
            onPrevious={()=> currentStoryId>0 ?setCurrentStoryId(currentStoryId-1):dispatch(setPreviousStory(story.id))}
            onNext={()=>currentStoryId<story.stories.length-1 ? setCurrentStoryId(currentStoryId+1):dispatch(setNextStory(story.id))}
		      	stories={selectedStory.stories}
            storyContainerStyles={{width:"100%",height:"100%",display:"flex"}}
            storyStyles={{width:"100wv",height:"auto",maxHeight:"96vh",maxWidth:"96vw",display:"flex",alignItems:"center",justifyContent:"center"}}
			      width={'100vw'}
			      height={'100vh'}
            onAllStoriesEnd={()=>{ setTimeout(() => {
              setCurrentStoryId(0)
                dispatch(setNextStory(selectedStory.id))
            }, 10);}}
		/>
    </div>  }
          {/* <SkeletonTheme baseColor="#202020" highlightColor="#444"> */}
            <Skeleton duration={0.5} count={1} style={{position:"absolute",top:"0px",left:"0px",borderRadius:"10px",width:"100%",height:"100%"}}/>

        {(viewedStory.full_video_path||viewedStory.photo_path)&&
        <AdvancedImage className='thumb-img' alt='story' width={145} height={255} priority={"true"} cldImg={getThumb(viewedStory.full_video_path||viewedStory.photo_path,viewedStory.full_video_path)} style={{width:"100%",height:"100%",borderRadius:"10px",objectFit:"cover",zIndex:"2"}}/>}
    </div>
  )
}

export default StoryComponent