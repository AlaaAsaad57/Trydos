import { useEffect,useRef, useState } from "react";
import SearchIcon from "@/assets/svg/SearchIcon.svg"
import Divider from "@/assets/svg/DividerIcon.svg"
import CloseIcon from "@/assets/svg/CloseIcon.svg"
import { useSelector } from "react-redux";
function SearchComponent({searchEnabled,close}) {
  const language=useSelector((state)=>state.homepage.language)
    const [searchValue,setSearchValue]=useState('')
    function useOutsideAlerter(ref) {
        useEffect(() => {
          /**
           * Alert if clicked on outside of element
           */
          function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
              if(searchEnabled&&!searchValue.length>0){
                close()
              }
            }
          }
          // Bind the event listener
          document.addEventListener("mousedown", handleClickOutside);
          return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
          };
        }, [ref,searchValue]);
      }
      const wrapperRef = useRef(null);
      const inputRef = useRef(null);
      useOutsideAlerter(wrapperRef);
      useEffect(()=>{
        if(searchEnabled){
            inputRef.current.focus()
        }
      },[searchEnabled])
  return (
    <div  ref={wrapperRef}  className={`search-component-container ${!searchEnabled&&'hide-bar'}`}>
        <SearchIcon/>
        <Divider style={{marginLeft:"10px"}}/>
        <input aria-labelledby={language+'-light'} ref={inputRef} value={searchValue} onChange={(e)=>setSearchValue(e.target.value)}/>
        <CloseIcon style={{cursor:"pointer"}} onClick={()=>{ setSearchValue(''); close();}}/>

    </div>
  )
}

export default SearchComponent