import Animated from '@/components/global/Animated'
import { GET_USERS_STORIES, STORIES_URL } from '@/utils/endpointConfig'
import { getStoriesHeaders } from '@/utils/functions'
import { revalidatePath } from 'next/cache'
import React from 'react'

const getStories=async()=>{
 
  const res = await fetch(STORIES_URL+GET_USERS_STORIES,getStoriesHeaders())
  const repo = await res.json()
  return repo.data.data
}
const getStoriesRes=async()=>{
  const res = await fetch(STORIES_URL+GET_USERS_STORIES,getStoriesHeaders())
  const repo = await res.json()
  return repo
}
async function Test() { 
  const data = await getStories();
    return(<>
       <Animated res={getStoriesRes()} stories={data}/>

    </>
  )
}

export default Test