"use client";
import "statics/assets/css/home.css"
import Navbar from '@/components/Home/Navbar'
import { useSelector } from "react-redux";
import TranslationsMenu from "@/components/global/TranslationsMenu";
export default function Home() {
  const language=useSelector((state)=>state.homepage.language)
  return (
     <div aria-details={language}className='site-container'>
        <div aria-details={language}className='home-page-container'>
          <TranslationsMenu/>
            <Navbar/>
        </div>
    </div>
  )
}
