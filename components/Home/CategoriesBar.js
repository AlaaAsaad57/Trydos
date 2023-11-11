import { categories } from "../../utils/constants"
import CategoryNavItem from "./CategoryNavItem"
import { useState } from "react"
import { useSelector } from "react-redux"
import Skeleton from 'react-loading-skeleton'
import '../../styles/skeleton.css'
function CategoriesBar({forMobile,key}) {
  const language=useSelector((state)=>state.homepage.language)
  const loading=useSelector((state)=>state.homepage.loading)
const [searchEnabled,setSearchEnabled]=useState(false)

  return (
    <div aria-details={language}className={`categories-bar-container ${forMobile&&'mobile-bar'}`} style={{marginLeft:searchEnabled?"13px":"50px"}}>
      {
        categories.map((category,key)=>(
       
        loading?
        <div className="categories-bar-item" aria-details={language} key={key}>
          <div className="categories-bar-item-icon" aria-details={language} >
            <Skeleton  duration={0.5} count={1} circle={true} width={'100%'} height={'100%'}/>
          </div>
        </div>
        :
        <CategoryNavItem  
        searchEnabled={searchEnabled}
        close={()=>setSearchEnabled(false)}
        openSearch={()=>setSearchEnabled(true)}
        name={category.name}
        key={key}
        icon={category.icon}/>
        
      
          
        ))
      }
     
    </div>
  )
}

export default CategoriesBar