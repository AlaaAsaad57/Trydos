import React, { useEffect } from 'react'
import StoryElement from "./StoryElement"
function index() {

const getBorderWidth=()=>{
  let elem=document.querySelector(".site-container")
  if(elem?.clientWidth <1443)
  return elem?.clientWidth
else return 1433
}
  return (
    <div className='stories-bar-container'>
            <div id="stories-bar" className='stories-bar'>
            <svg id="stories-border1" className='border' xmlns="http://www.w3.org/2000/svg" width={getBorderWidth()} height="0.5" viewBox={`0 0 ${getBorderWidth()} 0.5`}>
            <line id="Line_1107" data-name="Line 1107" x2={getBorderWidth()} transform="translate(0 0.25)" fill="none" stroke="#3c3c3c" stroke-width="0.5" stroke-dasharray="3 3"/>
            </svg>
            <svg id="stories-border2" className='border' xmlns="http://www.w3.org/2000/svg" width={getBorderWidth()} height="0.5" viewBox={`0 0 ${getBorderWidth()} 0.5`}>
            <line id="Line_1107" data-name="Line 1107" x2={getBorderWidth()} transform="translate(0 0.25)" fill="none" stroke="#3c3c3c" stroke-width="0.5" stroke-dasharray="3 3"/>
            </svg>
            <StoryElement/>
            </div>

    </div>

  )
}

export default index