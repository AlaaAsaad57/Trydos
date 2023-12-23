"use server"

import { GET_USERS_STORIES, HOME_DATA_URL, OTP_URL, STORIES_URL } from "../../utils/endpointConfig"
import { cookies } from 'next/headers'

export const getStories=async()=>{
    try{
      const res = await fetch(STORIES_URL+GET_USERS_STORIES,{next:{revalidate:1},headers:DataApiHeaders()},)
      let returned_res={type:res.type,headers:[...res.headers,...DataApiHeaders()],url:res.url}
      const repo = await res.json()
    
      return [repo.data.data,returned_res]
    }catch(e){
  
    }
   
  }

  export const getHomeData=async()=>{
    try{
      // const resSetting = await fetch(OTP_URL+STARTER_SETTINGS,GeneralCahcedHeader('starter-setting'))
      // const repoSetting = await resSetting.json()
      const res = await fetch(OTP_URL+HOME_DATA_URL,{next:{revalidate:1},
         headers: DataApiHeaders()})
         let returned_res={type:res.type,headers:[...res.headers,...DataApiHeaders()],url:res.url,}
      const repo = await res.json();
      return  [repo.data,returned_res]||[]
    }catch(e){
      console.log(e)
  return {}
    }
  }
  export const DataApiHeaders=()=>{
    const cookieStore = cookies()
    return new Headers({ language:cookieStore.get('language').value,country:cookieStore.get('country')&&cookieStore.get('country').value })
  }
  export const changeAppLanguageServer=(language)=>{
const cookieStore = cookies()
cookieStore.set('language',language)
  }