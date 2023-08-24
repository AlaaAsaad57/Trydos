import { useState } from "react"
import CategoriesBar from "./CategoriesBar"
import Logo from "./Logo"
import UserNavTopSection from "./UserNavTopSection"
import { useSelector } from "react-redux"

function Navbar() {

  const [loginOpen,setLoginOpen]=useState(false)
  const language=useSelector((state)=>state.homepage.language)
  return (
    <div aria-details={language}className="home-navbar">
        <Logo/>
        <CategoriesBar/>
        {<UserNavTopSection loginOpen={loginOpen} openLogin={(e)=>setLoginOpen(e)}/>}
   
    </div>
  )
}

export default Navbar