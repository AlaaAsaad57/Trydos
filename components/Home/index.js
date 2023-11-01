"use client";
import "styles/home.css"
import Navbar from '../../components/Home/Navbar'
import { useDispatch, useSelector } from "react-redux";
import TranslationsMenu from "../../components/global/TranslationsMenu";
import { useEffect } from "react";
import { GetMainData, GetStoryData, RegisterDevice } from "../../redux/homepage/actions";
import Stories from "./Stories/index"
import CategoriesBar from "./CategoriesBar";
import BrandsBar from "./Bars/BrandsBar"
import QuickOffer from "./Bars/QuickOffer"
import OfferBar from "./Bars/OfferBar"
import CategoryBar from "./Bars/CategoryBar"
import OffersList from "./OfferWidgets/OfferList"
import StoriesComponent from "./Stories/StoriesComponent"
import { CheckLogin } from "../../redux/auth/actions";
export default function Home({stories,res,categories,settings}) {
  
  const language=useSelector((state)=>state.homepage.language)
  useEffect(()=>{ 
    dispatch(GetStoryData(stories))
    dispatch(GetMainData(categories,settings))
    CheckLogin()
    setTimeout(()=>{
      RegisterDevice()
    },5000)
  },[])
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
        <div aria-details={language}className='home-page-container'>
           <TranslationsMenu/>
           <StoriesComponent/>
            <Navbar/>
            <Stories/>
            <CategoriesBar forMobile={true}/>
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

