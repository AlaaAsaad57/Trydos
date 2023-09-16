import Home from '../components/Home'
import { GET_USERS_STORIES, STORIES_URL } from '../utils/endpointConfig'
import { getStoriesHeaders } from '../utils/functions'
import React from 'react'
const getStories=async()=>{
  try{
    const res = await fetch(STORIES_URL+GET_USERS_STORIES,getStoriesHeaders())
    const repo = await res.json()
    return repo.data.data
  }catch(e){

  }

}
async function page() {
  const data = await getStories();

  return (
    <>
      <Home stories={data}/>
    </>
  )
}

export default page