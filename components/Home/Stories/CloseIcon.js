import React from 'react'

function CloseIcon({close}) {
  return (
    <div className='close-stories-icon' style={{position:'fixed',top:"25px",right:"20px",zIndex:"2000",cursor:"pointer"}} onClick={()=>close()}>
    <svg xmlns="http://www.w3.org/2000/svg" width="16.411" height="16.411" viewBox="0 0 16.411 16.411">
    <g id="Group_10735" data-name="Group 10735" transform="translate(-1293.141 -97.641)">
      <line id="Line_792" data-name="Line 792" x2="20.848" transform="matrix(0.695, -0.719, 0.719, 0.695, 1294.105, 113.345)" fill="none" stroke="#f3f3f3" strokeLinecap="round" strokeWidth="1"/>
      <line id="Line_793" data-name="Line 793" x2="20.848" transform="matrix(0.719, 0.695, -0.695, 0.719, 1293.849, 98.605)" fill="none" stroke="#f3f3f3" strokeLinecap="round" strokeWidth="1"/>
    </g>
  </svg>
  </div>
  )
}

export default CloseIcon