import {translations} from "assets/translations/translations.js"
import { myCld } from "./constants";
import { quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { Resize } from "@cloudinary/url-gen/actions";
export function translate(key,language){
return translations[language][key] || key
}
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
    story.stories.map((storyItem)=>{
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
             duration:5000,
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