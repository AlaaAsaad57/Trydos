import axios from "axios"
import { GET_USERS_STORIES, OTP_URL, STORIES_URL,REGISTER_DEVICE_URL, STARTER_SETTINGS, UPLOAD_STORY_URL } from "utils/endpointConfig"
import { SSRDetect } from "utils/functions"
import { changeAppLanguageServer } from "./cachedActions";
import { SmartLookInit } from "utils/constants";
import Smartlook from 'smartlook-client'
import Cookies from "js-cookie";
/*General Actions */
export const RegisterDevice=async ()=>{
    try{
        if(SSRDetect()&&!localStorage.getItem('DEVICE-TOKEN')&&!localStorage.getItem('USER')){
        let response=await axios.post(OTP_URL+REGISTER_DEVICE_URL)
        localStorage.setItem('DEVICE-TOKEN',response.data.data.token)
    }

    }
    catch(e){

    }
} 
export const changeAppLanguage=(language)=>{
    EventTrack('change-language', {
        language: language
    })
    Cookies.set('language',language);
    changeAppLanguageServer(language);
    return({type:"APP-LANGUAGE",payload:language})
}
export const GetMainData=(data)=>{
    return({type:"SITE-MAIN-DATA",payload:data})
}
/*Stories Actions */
export const SelectStory=(e)=>{
    return({type:"STORY-SELECTED",payload:e})
}
export const GetStoryData=(data)=>{
    return({type:"STORY-DATA",payload:data})
}
export const setNextStory=(storyId)=>{
    return({type:"NEXT-STORY",payload:storyId})
}
export const setPreviousStory=(storyId)=>{
    return({type:"PREV-STORY",payload:storyId})
}
export const AddStoryAction=(story)=>{

    return({type:"ADD-STORY",payload:story})
}
export const upload=async (file,callback,is_video,endUpload)=>{
    const upload_token=SSRDetect()&&localStorage.getItem('STORIES-TOKEN')
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_video",is_video)
  try{
    let response=await axios.post(STORIES_URL+UPLOAD_STORY_URL,formData,{ headers: {
        "Content-Type": "multipart/form-data",
            Authentication: `Bearer ${upload_token}`,
            Authorization: `Bearer ${upload_token}`,
        
      },
      onUploadProgress : (progressEvent) => {
          callback(Math.round((progressEvent.loaded * 100) / progressEvent.total))
      },})
      endUpload()
      return response.data.data
  }catch(e){
    callback(null)
    endUpload()
  } 
}
export const UserStartStory=()=>{
    
}
export const UserEndStory=()=>{

}
export const LogData=(data)=>{
    if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true'){
      
      if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(data)
    }
  }
 export const EventTrack= (name,data)=>{
    if(Smartlook.initialized){
        Smartlook.track(name,data||{})
    }
    else{
        SmartLookInit()
        Smartlook.track(name,data||{})
    }
  }
export  const StopTracking=()=>{
    Smartlook.anonymize()
  }