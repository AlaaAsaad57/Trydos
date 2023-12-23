"use client";
import "styles/home.css"
import Navbar from '../../components/Home/Navbar'
import { useDispatch, useSelector } from "react-redux";
import TranslationsMenu from "../../components/global/TranslationsMenu";
import { useEffect } from "react";
import { GetMainData, GetStoryData, RegisterDevice, changeAppLanguage } from "../../redux/homepage/actions";
import Stories from "./Stories/index"
import CategoriesBar from "./CategoriesBar";
import BrandsBar from "./Bars/BrandsBar"
import QuickOffer from "./Bars/QuickOffer"
import OfferBar from "./Bars/OfferBar"
import CategoryBar from "./Bars/CategoryBar"
import OffersList from "./OfferWidgets/OfferList"
import StoriesComponent from "./Stories/StoriesComponent"
import { CheckLogin, StoreToken } from "../../redux/auth/actions";
import ChatModal from '../Chat/ChatModal'
import { ToastContainer } from "react-toastify";
import  "react-toastify/dist/ReactToastify.min.css";
import "react-toastify/dist/ReactToastify.css"
import { onMessageListener, requestFirebaseNotificationPermission } from "../../utils/firebaseInitv1";
import { getUserChat } from "../../utils/functions";
import Cookies from "js-cookie"
export default function Home({stories,HomeData_res,stories_res,HomeData}) {
  
  const language=useSelector((state)=>state.homepage.language)
  const fbtoken=useSelector((state)=>state.homepage.fbtokfbTokenen)
  useEffect(()=>{ 
    let languageCookies=Cookies.get("language");
    if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true'){
      
      console.log(stories_res,HomeData_res)
    }
    dispatch(changeAppLanguage(languageCookies||language||'en'))
    dispatch(GetStoryData(stories))
    dispatch(GetMainData(HomeData))
    setTimeout(()=>{
      RegisterDevice()
      CheckLogin()
    },2000)


  },[])
  try {
    requestFirebaseNotificationPermission().then((fbtoken)=>{
      if(fbtoken){
       fbtoken&& StoreToken({
          id:getUserChat().id,
          token:fbtoken,
          user:getUserChat()
        })
      }
    })
    typeof window !=='undefined'&& 'serviceWorker' in navigator&& onMessageListener().then(payload => {
      console.log(payload)
   }).catch(err => console.log('failed: ', err));
  }catch(e){
    console.log(e)
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
     <div aria-details={language}className='site-container'>
      <audio style={{position:'absolute',fontFamily:"icon-font",opacity:0}} muted autoPlay src="/default.mp3">
        <source src="/default.mp3"/>
      </audio>
      <ToastContainer/>
        <div aria-details={language}className='home-page-container'>
           <TranslationsMenu/>
           <StoriesComponent/>
            <Navbar/>
            <ChatModal/>
            <Stories/>
            <CategoriesBar forMobile={true} />
            <BrandsBar/>
            <OffersList offers={[1,1,1]}/>
            <CategoryBar/>
            <OfferBar/>
            <QuickOffer/>
            <OffersList quick={true} offers={[1]}/>
        </div>
    </div>
  )
}

