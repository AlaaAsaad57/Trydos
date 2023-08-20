"use client";
import "@/assets/css/home.css"
import Navbar from '@/components/Home/Navbar'
export default function Home() {
  return (
     <div className='site-container'>
        <div className='home-page-container'>
            <Navbar/>
        </div>
    </div>
  )
}
