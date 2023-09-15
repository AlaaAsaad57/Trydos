"use client";
import React, { useEffect } from 'react'
import AnimatedSvg from "./AnimatedLogo.svg"
import "@/styles/home.css"
import { useDispatch, useSelector } from 'react-redux'
import StoriesBar from '../Home/Stories';
import { GetStoryData } from '@/redux/homepage/actions';
function Animated({stories}) {
    const storiesData=useSelector((state)=>state.homepage.storiesData)
    const dispatch=useDispatch()
    useEffect(()=>{
        dispatch(GetStoryData(stories))
      },[]) 
  return (
    <div className='animated-container' style={{flexDirection:"column"}}>
        <AnimatedSvg/>
        <StoriesBar stories={storiesData}/>

    </div>
  )
}

export default Animated