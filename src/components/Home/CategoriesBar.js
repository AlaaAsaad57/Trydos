import { categories } from "@/utils/constants"
import CategoryNavItem from "./CategoryNavItem"
import { useState } from "react"
function CategoriesBar() {
const [searchEnabled,setSearchEnabled]=useState(false)

  return (
    <div className="categories-bar-container" style={{marginLeft:searchEnabled?"13px":"50px"}}>
      {
        categories.map((category)=>(
          <CategoryNavItem searchEnabled={searchEnabled} close={()=>setSearchEnabled(false)} openSearch={()=>setSearchEnabled(true)} name={category.name} icon={category.icon}/>
        ))
      }
     
    </div>
  )
}

export default CategoriesBar