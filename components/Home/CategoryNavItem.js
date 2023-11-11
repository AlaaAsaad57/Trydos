import { translate } from "../../utils/functions"
import { useSelector } from "react-redux"
import NavIcon from "../../public/svg/navIcon.svg"
import SearchComponent from "./SearchComponent"
const CategoryNavItem=({name, icon,searchEnabled,close,openSearch,key})=> {
    const language=useSelector((state)=>state.homepage.language)
    const clickItem=()=>{
      if(name==='Search'){
        openSearch()
      }
    }
  return (
 (!searchEnabled||name==='Search')&& 
    <div aria-details={language}className="categories-bar-item" onClick={()=>clickItem()} key={key}>
       {!searchEnabled&& <div aria-details={language}className="categories-bar-item-icon">
           {icon}
        </div>}
       {!searchEnabled&& <div aria-details={language}className="categories-bar-item-description">
            <div aria-details={language}className="categories-bar-item-name" aria-labelledby={language+'-regular'}>
                {translate(name,language)}
            </div>
           <NavIcon/>

        </div>}
        {
            name==='Search'&&<SearchComponent close={()=>close()} searchEnabled={searchEnabled}/>
        }
    </div>
 
  )
}

export default CategoryNavItem