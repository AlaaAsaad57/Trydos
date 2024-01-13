import {translations} from "public/translations/translations.js"
import { myCld } from "./constants";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { Resize } from "@cloudinary/url-gen/actions";
import profilePicture from "public/images/profileNo.png"
export const SSRDetect=()=>{
    return (typeof window !== 'undefined' )
}
export function translate(key,language){
return translations[language][key] || key
}
export const getId=()=>{
    return "img"+parseInt(Math.random()*10000)
}

const token=SSRDetect()&&localStorage.getItem('STORIES-TOKEN');
export const getStoriesHeaders=()=>{
    return {
        headers:{
            Authentication: `Bearer ${token}`,
            Authorization: `Bearer ${token}`,
        },
        
        next:{tags:['stories'],revalidate:1}
    }
}
export const GeneralCahcedHeader=(apiName)=>{
    return({
    
        next:{tags:[apiName],revalidate:1}
    })
}
export const configureStory=(story)=>{
    let returnedData=[]
    story?.stories?.map((storyItem)=>{
         if(storyItem.full_video_path){
            let vid = myCld.video(storyItem.full_video_path?.split("/").pop().split(".")[0]).delivery(quality(auto()));
            returnedData.push({ 
             url:vid.toURL(),
             FixedUrl:vid,
             url:storyItem.full_video_path,
             FixedUrl:storyItem.full_video_path,
 
             header: {
                heading: story.name??story.mobile_phone??'Unknown',
                subheading: 'Posted 30m ago',
                profileImage: story.photo_path??profilePicture.src,
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
                heading: story.name??story.mobile_phone??'Unknown',
                subheading: 'Posted 30m ago',
                profileImage: story.photo_path??profilePicture.src,
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
    return  (myCld.image(url?.split("/").pop().split(".")[0]).resize(Resize.thumbnail('145','255')).delivery(quality(auto())))
}

}
export const getUser=()=>{
    return localStorage.getItem('USER-CHAT')&&JSON.parse(localStorage.getItem('USER'))
}
export const getUserChat=()=>{
    return localStorage.getItem('USER-CHAT')&&JSON.parse(localStorage.getItem('USER-CHAT'))
}