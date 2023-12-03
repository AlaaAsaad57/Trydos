import React,{memo} from 'react'
function PointsSlider({isActiveTopSlide,setActiveTopSlide,activeIndex,colors}) {
    const getSize=(i)=>{
        if((i===activeIndex)||(i===activeIndex&&i===0)) return 6
        else if(i===activeIndex-1||i===activeIndex+1) return 4
        else  return 2
        
        }
      
  return (
    <>
    {!isActiveTopSlide&&     
       <div className='top-slider-enable' onClick={()=>{setActiveTopSlide();}}>
     {colors.map((img,i)=>(
        <div key={i} className={`slider-point-item w-${getSize(i)} ${activeIndex===i&&'active-point-item'}`}>
            {getSize(i)===2?
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="2" height="2">
            <g >
              <g  stroke="#3c3c3c" strokeWidth="0.3">
                <circle cx="1" cy="1" r="0.85" fill="none"/>
              </g>
            </g>
          </svg>:
          getSize(i)===4?
          <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="4" height="4">
          <g >
            <g stroke="#3c3c3c" strokeWidth="0.3">
              <circle cx="2" cy="2" r="1.85" fill="none"/>
            </g>
          </g>
        </svg>
        :
        getSize(i)===6&&
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="6" height="6">
        <g >
          <g id="Ellipse_4-2" data-name="Ellipse 4"  fill="none" stroke="#3c3c3c" strokeWidth="0.3">
            <circle cx="3" cy="3" r="2.85" fill="none"/>
          </g>
        </g>
      </svg>
        }

      </div>
     )) }
                </div>}
    </>
  )
}

export default memo(PointsSlider)

