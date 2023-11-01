"use server"

import { GET_USERS_STORIES, MAIN_CATEGORIES, OTP_URL, STARTER_SETTINGS, STORIES_URL } from "../../utils/endpointConfig"
import { GeneralCahcedHeader, getStoriesHeaders } from "../../utils/functions"

export const getStories=async()=>{
    try{
      const res = await fetch(STORIES_URL+GET_USERS_STORIES,getStoriesHeaders())
      const repo = await res.json()
    
      return repo.data.data
    }catch(e){
  
    }
   
  }

  export const getCategories=async()=>{
    try{
      const resSetting = await fetch(OTP_URL+STARTER_SETTINGS,GeneralCahcedHeader('starter-setting'))
      const repoSetting = await resSetting.json()
      const res = await fetch(OTP_URL+MAIN_CATEGORIES,GeneralCahcedHeader('main-categories'))
      const repo = await res.json()
      return [
        repo.data.categories||[],
      repoSetting.data||[]
      ]
    }catch(e){
      console.log(e)
  return[ [],[]]
    }
  }