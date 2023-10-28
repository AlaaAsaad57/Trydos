import React from 'react'

function BorderImage({id}) {
    const getHeight=()=>{
        let elem=document.querySelector(`#${id}`)
   
        return elem?.clientHeight
    }
    const getWidth=()=>{
        let elem=document.querySelector(".OfferImage")
        return "100%"
    }
  return (
    <svg className="image-border" xmlns="http://www.w3.org/2000/svg" width={getWidth()} height={"100%"} viewBox={`0 0 ${getWidth()} ${getHeight()}`}>
    <g id="Rectangle_4745" data-name="Rectangle 4745" fill="none" stroke="#fafafa" stroke-width="0.5">
      <rect width={getWidth()} height={"100%"} rx="15" stroke="none"/>
      <rect x="0.25" y="0.25" width={getWidth()} height={"100%"} rx="14.75" fill="none"/>
    </g>
  </svg>
  )
}

export default BorderImage