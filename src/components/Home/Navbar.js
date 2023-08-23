import { useState } from "react"
import CategoriesBar from "./CategoriesBar"
import Logo from "./Logo"
import UserNavTopSection from "./UserNavTopSection"

function Navbar() {

  const [loginOpen,setLoginOpen]=useState(false)
  return (
    <div className="home-navbar">
        <Logo/>
        <CategoriesBar/>
        {<UserNavTopSection loginOpen={loginOpen} openLogin={(e)=>setLoginOpen(e)}/>}
   
    </div>
  )
}

export default Navbar