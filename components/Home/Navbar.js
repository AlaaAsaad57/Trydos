import { useEffect, useState } from "react"
import CategoriesBar from "./CategoriesBar"
import Logo from "./Logo"
import UserNavTopSection from "./UserNavTopSection"
import { useDispatch, useSelector } from "react-redux"
import { changeAppLanguage } from "store/homepage/actions"
import Cookies from "js-cookie"
function Navbar({init}) {
  const [loginOpen,setLoginOpen]=useState(false)
  const language=useSelector((state)=>state.homepage.language)
  const dispatch=useDispatch()
  useEffect(()=>{
    let languageCookies=Cookies.get("language");
   
    dispatch(changeAppLanguage(init.split('-')[1]||languageCookies||language||process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE))
  },[])
  return (
    <div aria-details={language}className="home-navbar">
        <Logo/>
        <CategoriesBar forMobile={false}/>
        {<UserNavTopSection loginOpen={loginOpen} openLogin={(e)=>setLoginOpen(e)}/>}
   
    </div>
  )
}

export default Navbar