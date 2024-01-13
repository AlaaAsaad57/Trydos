"use client";
import React, { useEffect } from 'react'
import "styles/home.css"
import { useDispatch, useSelector } from 'react-redux'
import StoriesBar from '../Home/Stories';
import { GetStoryData } from 'store/homepage/actions';
import { getStoriesHeaders } from 'utils/functions';
import { GET_USERS_STORIES, STORIES_URL } from 'utils/endpointConfig';
import Logo from "./logo.svg"
import "./animate.css"
function Animated({stories}) {
  
    const storiesData=useSelector((state)=>state.homepage.storiesData)
    const dispatch=useDispatch()
    useEffect(()=>{
        dispatch(GetStoryData(stories))
       try{
         fetch(STORIES_URL+GET_USERS_STORIES,getStoriesHeaders()).then((res) => res.json()).then((data)=>{
      
        }).catch(e=>{if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log("stories endpoints error")})}
        catch(e){
          
        }
      },[]) 
  return (
    <div className='animated-container' style={{flexDirection:"column"}}>
      <Logo/>
        <StoriesBar stories={storiesData}/>

    </div>
  )
}

export default Animated