import {translations} from "assets/translations/translations.js"
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
