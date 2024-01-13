"use server"

import { GET_USERS_STORIES, HOME_DATA_URL, LISTING_INFO_URL, OTP_URL, STORIES_URL } from "utils/endpointConfig"
import { cookies } from 'next/headers'

export const getStories=async()=>{
    try{
      let time=new Date().getTime()
      const res = await fetch(STORIES_URL+GET_USERS_STORIES,{next:{revalidate:1},headers:DataApiHeaders()},);
      const repo = await res.json();
       time=new Date().getTime()-time
      let returned_res={type:res.type,headers:[...res.headers,...DataApiHeaders()],url:res.url,time:time+'ms',body:repo}   
      return [repo.data.data,returned_res]
    }catch(e){
      if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(e)
      return ['stories-error',e]
    }
   
  }

  export const getHomeData=async()=>{
    try{
      // const resSetting = await fetch(OTP_URL+STARTER_SETTINGS,GeneralCahcedHeader('starter-setting'))
      // const repoSetting = await resSetting.json()
      let time=new Date().getTime()
      const res = await fetch(OTP_URL+HOME_DATA_URL,{next:{revalidate:1},
         headers: DataApiHeaders()})
         const repo = await res.json();
         time=new Date().getTime()-time
         let returned_res={type:res.type,headers:[...res.headers,...DataApiHeaders()],url:res.url,time:time+'ms',body:repo}
      return  [repo.data,returned_res]||[]
    }catch(e){
      if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(e)
      return ['homedata-error',e]
    }
  }
  export const DataApiHeaders=()=>{
    const cookieStore = cookies()
    return new Headers({ language:cookieStore.get('language')?.value==='ar'?'ae':cookieStore.get('language')?.value||'en',country:cookieStore.get('country')&&cookieStore.get('country').value })
  }
  export const changeAppLanguageServer=(language)=>{
const cookieStore = cookies()
cookieStore.set('language',language)
  }
  export const getListingData=async()=>{
    try{
      // const resSetting = await fetch(OTP_URL+STARTER_SETTINGS,GeneralCahcedHeader('starter-setting'))
      // const repoSetting = await resSetting.json()
      let time=new Date().getTime()
      const res = await fetch(OTP_URL+LISTING_INFO_URL,{next:{revalidate:1},
         headers: DataApiHeaders()})
         const repo = await res.json();
         time=new Date().getTime()-time
         let returned_res={type:res.type,headers:[...res.headers,...DataApiHeaders()],url:res.url,time:time+'ms',body:repo}
      return  [repo.data,returned_res]||[]
    }catch(e){
      if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(e)
      return ['listing-error',e]
    }
  }