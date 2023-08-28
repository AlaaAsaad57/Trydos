"use client";
import "styles/home.css"
import Navbar from '@/components/Home/Navbar'
import { useSelector } from "react-redux";
import TranslationsMenu from "@/components/global/TranslationsMenu";
import { useEffect } from "react";
// import LoadingWidjet from "@/components/global/LoadingWidjet";
export default function Home() {
  const language=useSelector((state)=>state.homepage.language)
  const loading=useSelector((state)=>state.homepage.loading)
  useEffect(()=>{

  },[])
  return (
     <div aria-details={language}className='site-container'>
        <div aria-details={language}className='home-page-container'>
          <TranslationsMenu/>
      
            <Navbar/>
        </div>
    </div>
  )
}
