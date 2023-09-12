"use client";
import "styles/home.css"
import Navbar from '@/components/Home/Navbar'
import { useDispatch, useSelector } from "react-redux";
import TranslationsMenu from "@/components/global/TranslationsMenu";
import { useEffect, useState } from "react";
import { GET_USERS_STORIES, STORIES_URL } from "@/utils/endpointConfig";
import { getStoriesHeaders } from "@/utils/functions";
import { headers } from "next/dist/client/components/headers";
import StoriesBar from "./Stories";
import { GetStoryData } from "@/redux/homepage/actions";

export default function Home({stories}) {
  const language=useSelector((state)=>state.homepage.language)
  const loading=useSelector((state)=>state.homepage.loading)
  useEffect(()=>{
    dispatch(GetStoryData(stories))
  },[])
  const storiesData=useSelector((state)=>state.homepage.storiesData)
  const dispatch=useDispatch()
  return (
     <div aria-details={language}className='site-container'>
        <div aria-details={language}className='home-page-container'>
          <TranslationsMenu/>
      
            <Navbar/>
            <StoriesBar stories={storiesData}/>
        </div>
    </div>
  )
}

