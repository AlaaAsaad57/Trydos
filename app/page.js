import Home from '../components/Home'
import { getHomeData, getStories } from '../redux/homepage/cachedActions';
import React from 'react'

async function page() {
  const stories = await getStories(); 
  const HomeData=await getHomeData();



  return (
    <>
      <Home stories={stories} HomeData={HomeData}/>
    </>
  )
}

export default page