import { useEffect,useRef, useState } from "react";
import SearchIcon from "public/svg/SearchIcon.svg"
import Divider from "public/svg/DividerIcon.svg"
import CloseIcon from "public/svg/CloseIcon.svg"
import { useSelector } from "react-redux";
function SearchComponent({searchEnabled,close}) {
  const language=useSelector((state)=>state.homepage.language)
    const [searchValue,setSearchValue]=useState(null)
    function useOutsideAlerter(ref) {
        useEffect(() => {
          /**
           * Alert if clicked on outside of element
           */
          function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
             
              if(searchValue?.length===0){
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
        setSearchValue('')
        if(searchEnabled){
            inputRef.current.focus()
        }
      },[searchEnabled])
  return (
    <div aria-details={language} ref={wrapperRef}  className={`search-component-container ${!searchEnabled&&'hide-bar'}`}>
        <SearchIcon/>
        <Divider style={{marginLeft:"10px"}}/>
        <input aria-labelledby={language+'-light'} ref={inputRef} value={searchValue||""} onChange={(e)=>setSearchValue(e.target.value)}/>
        <CloseIcon style={{cursor:"pointer"}} onClick={()=>{ setSearchValue(''); close();}}/>

    </div>
  )
}

export default SearchComponent