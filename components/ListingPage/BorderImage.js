import React from 'react'

function BorderImage({isBig}) {
  return (
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <g id="PNORSSM823IY-BE29_view2" fill="none" stroke="#fff" strokeWidth="0.5">
    <rect width="100%" height="100%" rx="15" stroke="none"/>
    <rect x="0.25" y="0.25" width={isBig?"calc(100% - 0.5px)":"100%"} height={isBig?"calc(100% - 0.5px)":"100%"} rx="14.75" fill="none"/>
  </g>
</svg>

  
  )
}

export default BorderImage