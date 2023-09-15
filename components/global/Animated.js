"use client";
import React, { useEffect } from 'react'
import AnimatedSvg from "./AnimatedLogo.svg"
import "@/styles/home.css"
import { useDispatch, useSelector } from 'react-redux'
import StoriesBar from '../Home/Stories';
import { GetStoryData } from '@/redux/homepage/actions';
import { getStoriesHeaders } from '@/utils/functions';
import { GET_USERS_STORIES, STORIES_URL } from '@/utils/endpointConfig';
function Animated({stories}) {
  
    const storiesData=useSelector((state)=>state.homepage.storiesData)
    const dispatch=useDispatch()
    useEffect(()=>{
        dispatch(GetStoryData(stories))
        fetch(STORIES_URL+GET_USERS_STORIES,getStoriesHeaders()).then((res) => res.json()).then((data)=>{
            console.log(data)
        })
      },[]) 
  return (
    <div className='animated-container' style={{flexDirection:"column"}}>
        <AnimatedSvg/>
        <StoriesBar stories={storiesData}/>

    </div>
  )
}

export default Animated