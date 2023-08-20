import { translate } from "@/utils/functions"
import { useSelector } from "react-redux"
import NavIcon from "@/assets/svg/navIcon.svg"
import SearchComponent from "./SearchComponent"
function CategoryNavItem({name, icon,searchEnabled,close,openSearch}) {
    const language=useSelector((state)=>state.homepage.language)
    const clickItem=()=>{
      if(name==='Search'){
        openSearch()
      }
    }
  return (
  <>
    {(!searchEnabled||name==='Search')&& <div className="categories-bar-item" onClick={()=>clickItem()}>
       {!searchEnabled&& <div className="categories-bar-item-icon">
           {icon}
        </div>}
       {!searchEnabled&& <div className="categories-bar-item-description">
            <div className="categories-bar-item-name" aria-labelledby={language+'-regular'}>
                {translate(name,language)}
            </div>
           <NavIcon/>

        </div>}
        {
            name==='Search'&&<SearchComponent close={()=>close()} searchEnabled={searchEnabled}/>
        }
    </div>}
  </>
 
  )
}

export default CategoryNavItem