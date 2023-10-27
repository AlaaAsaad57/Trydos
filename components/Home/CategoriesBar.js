import { categories } from "../../utils/constants"
import CategoryNavItem from "./CategoryNavItem"
import { useState } from "react"
import { useSelector } from "react-redux"
function CategoriesBar({forMobile}) {
  const language=useSelector((state)=>state.homepage.language)
const [searchEnabled,setSearchEnabled]=useState(false)

  return (
    <div aria-details={language}className={`categories-bar-container ${forMobile&&'mobile-bar'}`} style={{marginLeft:searchEnabled?"13px":"50px"}}>
      {
        categories.map((category,key)=>(
          <CategoryNavItem key={key} searchEnabled={searchEnabled} close={()=>setSearchEnabled(false)} openSearch={()=>setSearchEnabled(true)} name={category.name} icon={category.icon}/>
        ))
      }
     
    </div>
  )
}

export default CategoriesBar