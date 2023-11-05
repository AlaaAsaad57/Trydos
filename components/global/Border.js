import React from 'react'

function Border({height,width,color}) {
    
  return (
    <svg style={{position:"absolute",left:"0px",top:"0px",zIndex:"1"}} xmlns="http://www.w3.org/2000/svg" width={width||"390"} height={height} >
    <g id="Rectangle_4732" data-name="Rectangle 4732" fill="none" stroke={color||"#707070"} strokeWidth="0.5" strokeDasharray="3 3">
      <rect id='firstRect' width={width||"390"} height={height} rx="20" stroke="none"/>
      <rect id='secondRect'  x="0.25" y="0.25" width={width?width - 0.5 :"389.5"} height={height - 0.5} rx="19.75" fill="none"/>
    </g>
  </svg>
  
  )
}

export default Border