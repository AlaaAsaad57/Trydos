import React from 'react'

function BorderImage({id}) {
    const getHeight=()=>{
      let elem
      if(typeof document !== 'undefined'){
           elem=document.querySelector(`#${id}`)
   
      
      }
      return elem?.clientHeight
    }
    const getWidth=()=>{
        
        return "100%"
    }
  return (
    <svg className="image-border" xmlns="http://www.w3.org/2000/svg" width={getWidth()} height={"100%"}>
    <g id="Rectangle_4745" data-name="Rectangle 4745" fill="none" stroke="#fafafa" strokeWidth="0.5">
      <rect width={getWidth()} height={"calc(100% - 0.5px)"} rx="15" stroke="none"/>
      <rect x="0.25" y="0.25" width={getWidth()} height={"calc(100% - 0.5px)"} rx="14.75" fill="none"/>
    </g>
  </svg>
  )
}

export default BorderImage