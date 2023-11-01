import axios from "axios"
import { GET_USERS_STORIES, OTP_URL, STORIES_URL,REGISTER_DEVICE_URL } from "../../utils/endpointConfig"
import { SSRDetect } from "../../utils/functions"
/*General Actions */
export const RegisterDevice=async ()=>{
    try{
        let response=await axios.post(OTP_URL+REGISTER_DEVICE_URL)
        localStorage.setItem('DEVICE-TOKEN',response.data.data.token)
    }
    catch(e){

    }
} 
export const changeAppLanguage=(language)=>{
    return({type:"APP-LANGUAGE",payload:language})
}
export const GetMainData=(categories,settings)=>{
    return({type:"SITE-MAIN-DATA",payload:{categories:categories,settings:settings}})
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



