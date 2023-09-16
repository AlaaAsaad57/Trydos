import {translations} from "../public/translations/translations.js"
import { myCld } from "./constants";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { Resize } from "@cloudinary/url-gen/actions";
import axios from "axios";
import { STORIES_URL, UPLOAD_STORY_URL } from "./endpointConfig";
export function translate(key,language){
return translations[language][key] || key
}
const upload_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZGJiNmI5OGVlNzUxZDVjMGE3NGFiZDVhM2VlYTU5M2FjMWEzMjQwZDQ3NDllZjRiNjFmYmI1ZWY3ZjgwMmE5YjJjNGY1OGVmMzgxZmQ0ZDMiLCJpYXQiOjE2OTQwMjk4NTkuNTUyMzIzLCJuYmYiOjE2OTQwMjk4NTkuNTUyMzI2LCJleHAiOjE3MjU2NTIyNTkuNTQzNDA4LCJzdWIiOiI0Iiwic2NvcGVzIjpbXX0.FZmIZL-iPsqsjG3DOpaHQJbsDiB3VYDnSonJAAek8ApzLFIyQGmS1AwYaMMmrPSOEY7ZwVZpWG3b24r4uTcODAqjnVOgtQT1Au-E8QPo4n4wO22ZJBtbL4g4hS5Sw8pvpuosgvKxaEscQ3ycoTzUijPmztwcF4DywegovErrdpkaYkX8SFdUIlv0Yg9UiYt72JURVztIUIO-lABRC1HNtoCcL1DUzSGlRZ8Ni6Is8zajE8aHigt4Yaiy9E2N6JhWNw8pY6-VrBDm4yOdicVJ0P8ntNrvCyZw-yWJCVYFV-aPl6Q59FEjSXgUAq_O9dhQT9YNXZ7sIWlJbe498I4xy4axi9AaOPby7_0cBbCoPM3DRFx0mJHHv_84XWLoHB9A8xu-xBdJd0JKtcpeQrtCACf8weMTcb6uvEVClfA-crjsoWIYcUwqjM3HpJ3miI-QSB360v_wCZdEMxIvWAv8l_r4Y6K5VPxsp7ypELBCRelcF3ie4gnv4EvFyaTUbrk-OubmnoLD_4irUxqlhi1SgR7XqDDxOf1DUw2j62cfMttkCqxtkiCmdj9nVAoE4fnSSqxGxRGy5RjKI01x9z9CSAR5zUGw6Wu1MK0BydvZm_I-65jwDx4AWuqM3A8hJWAN1AMbSwmRxO9IjSUUBoby99p62SZt_FF7xZbWwzRO_t8"
const token='eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiN2Q2NGI0ZjQ0ZTAxMjkyYTMxYTAxMDg5MmQ5MDc0ZjM1ZjM1NmZmM2ZjZjU3ZTNkM2MyMWIxNDdkYTc3OTEwY2JmZjA3NDdlM2NlNGY5NmIiLCJpYXQiOjE2OTQ1MTc5NjcuOTgxNzk3LCJuYmYiOjE2OTQ1MTc5NjcuOTgxOCwiZXhwIjoxNzI2MTQwMzY3Ljk3MzgzMiwic3ViIjoiNiIsInNjb3BlcyI6W119.sOb2SVnUd286QkQfA_85i-ol4sFT18ViKB1scdVPvWboEzWzZruUZdiZhijrDhcrNPBhBjI9NemqV_c2-JCrGHowo6Cv2KJoGLVoEXxfqPzIZQVN3Smey4ZQbBRhel1IqxkGv4ZRgEpL_p1zbEC7Bnrc6FhdTEYEBi6Kjm_EPqFIhtNGw22dyFlB0Nljnz02mnCefCZngJQN85f81Pc-ieo4D9UDCCMxhyDXvwHoDHiH2Y3V8vfn3hQShPlOz9RJLfAIu7bWY6pCKljWqt303oVWkTHlV_fYwn21oeZUHF0L3NG6UBZ9WmeETx0_TY33tqPbaYTPAcPWSLskrgUvsQovfTPu31MrZi1eCpPPevZ6Kd9pH0UfPUD1q1qljKUH1eDSOAzw5K34TGwm5S79HHJvMzL7BN3koz20vME3FB_DORAFTVwd5-s4gGNNz6SZDfIisx0xYyiPDiTv7EYcxXTbQz-Hwo0RYVAhwbcxI1GX1PveJ_6wqYJlZfo57iQ0xoCGDjFTkV0_-xXlL1pGzAHoJ2WBDL7oqZQQrOUeKSCJP9yRB1H0t59XgQwHtNjsaOKxCRBROYOchykFXzVLh63RwPRIv08pOXXGQZbm_tW2BdNoRIKtoKu145rt37PmS3lBSZts3zXoe8gtccsu8gFGvtUO5FMlU9d6iNmbNWs';
export const getStoriesHeaders=()=>{
    return {
        headers:{
            Authentication: `Bearer ${token}`,
            Authorization: `Bearer ${token}`,
        },
        cache: 'force-cache' ,
    }
}
export const configureStory=(story)=>{
    let returnedData=[]
    story?.stories?.map((storyItem)=>{
         if(storyItem.full_video_path){
            let vid = myCld.video(storyItem.full_video_path?.split("/").pop().split(".")[0]).delivery(quality(auto()));
            returnedData.push({ 
             url:vid.toURL(),
             FixedUrl:vid,
             header: {
                heading: 'Mohit Karekar',
                subheading: 'Posted 30m ago',
                profileImage: 'https://picsum.photos/100/100',
            },
             duration:5000,
             preloadResource:true,
             type:"video"
          })
        }
        else if(storyItem.photo_path){
            let img = myCld.image(storyItem.photo_path?.split("/").pop().split(".")[0]).delivery(quality(auto()));
            returnedData.push({ 
             url:img.toURL(),
             FixedUrl:img,
             duration:20000,
             header: {
                heading: 'Mohit Karekar',
                subheading: 'Posted 30m ago',
                profileImage: 'https://picsum.photos/100/100',
            },
             preloadResource:true,
             type:"image"
          })
        }
    })
   return {...story,stories:returnedData}
}
export const getThumb=(url,isVideo)=>{
  if(url) {
    if(isVideo){
        return (myCld.video(url?.split("/").pop().split(".")[0]).resize(Resize.thumbnail('145','255')).format('jpg').delivery(quality(auto())))
    }
    else
    return  (myCld.image(url?.split("/").pop().split(".")[0]).resize(Resize.thumbnail('145','255')).delivery(quality(auto())))}

}
export const upload=async (file,callback,is_video,endUpload)=>{
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