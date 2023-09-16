import Animated from '../../components/global/Animated'
import { GET_USERS_STORIES, STORIES_URL } from '../../utils/endpointConfig'
import { getStoriesHeaders } from '../../utils/functions'
import React from 'react'

const getStories=async()=>{
 try{
  const res = await fetch(STORIES_URL+GET_USERS_STORIES,getStoriesHeaders())
  const repo = await res.json()
  return repo.data.data
 } catch(e){
console.log(e)
 }

}
async function Test() { 
  const data = await getStories();
    return(<>
       <Animated  stories={data}/>

    </>
  )
}

export default Test