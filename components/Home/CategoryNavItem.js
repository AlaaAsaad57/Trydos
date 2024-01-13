import { translate } from "utils/functions"
import { useSelector } from "react-redux"
import NavIcon from "public/svg/navIcon.svg"
import SearchComponent from "./SearchComponent"
import { useRouter } from "next/navigation"
import Link from "next/link"
const CategoryNavItem=({name, icon,searchEnabled,close,openSearch,myKey})=> {
    const language=useSelector((state)=>state.homepage.language)
    const router= useRouter()
    const clickItem=()=>{
      if(name==='Search'){
        openSearch()
      }
      else{
        
      }
    }
  return (
 (!searchEnabled||name==='Search')&& 
   name!=='Search'?<Link href={`/${name}`}>
     <div aria-details={language}className="categories-bar-item" onClick={()=>clickItem()} key={myKey}>
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
   </Link>: <div aria-details={language}className="categories-bar-item" onClick={()=>clickItem()} key={myKey}>
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