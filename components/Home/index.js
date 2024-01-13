"use client";
import "styles/home.css"
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { GetMainData, GetStoryData, LogData, RegisterDevice, StopTracking, changeAppLanguage } from "store/homepage/actions";
import Stories from "./Stories/index"
import CategoriesBar from "./CategoriesBar";
import BrandsBar from "./Bars/BrandsBar"
import QuickOffer from "./Bars/QuickOffer"
import OfferBar from "./Bars/OfferBar"
import CategoryBar from "./Bars/CategoryBar"
import OffersList from "./OfferWidgets/OfferList"
import StoriesComponent from "./Stories/StoriesComponent"
import { CheckLogin, StoreToken } from "store/auth/actions";
import { ToastContainer } from "react-toastify";
import  "react-toastify/dist/ReactToastify.min.css";
import "react-toastify/dist/ReactToastify.css"
import { onMessageListener, requestFirebaseNotificationPermission } from "utils/firebaseInitv1";
import {  getUserChat } from "utils/functions";
import Smartlook from 'smartlook-client'
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
const ChatModal =dynamic(()=>import('../Chat/ChatModal', { ssr: false }))

export default function Home({stories,HomeData_res,stories_res,HomeData}) {
  
  const language=useSelector((state)=>state.homepage.language)
  useEffect(()=>{ 
 
  
    Smartlook.navigation('/')
  
    LogData({stories_req_data:stories_res,HomeData_req_data:HomeData_res})

    dispatch(GetStoryData(stories))
    dispatch(GetMainData(HomeData))
  },[])
  try {
    requestFirebaseNotificationPermission().then((fbtoken)=>{
      if(fbtoken){
       fbtoken&& StoreToken({
          id:getUserChat()?.id,
          token:fbtoken,
          user:getUserChat()
        })
      }
    })
    typeof window !=='undefined'&& 'serviceWorker' in navigator&& onMessageListener().then(payload => {
      if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(payload)
   }).catch(err => {if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log('failed: ', err)});
  }catch(e){
    if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log(e)
  } 

  const selectedStory=useSelector(state => state.homepage.selectedStory)
  useEffect(()=>{
    if(selectedStory){
      document.body.style.overflowY = 'hidden'
    }
    else{
      document.body.style.overflowY = 'initial'
    }
  },[selectedStory])
  const dispatch=useDispatch() 
  return (
     <>
      <ToastContainer/>
        
           
            <Stories/>
            <CategoriesBar forMobile={true} />
            <BrandsBar/>
            <OffersList offers={[1,1,1]}/>
            <CategoryBar/>
            <OfferBar/>
            <QuickOffer/>
            <OffersList quick={true} offers={[1]}/>
 
    </>
  )
}

