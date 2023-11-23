import Image from 'next/image'
import React from 'react'

function ImageAvatar({image,width,height,alt,zIndex,isActive,onClick,index,swiperRef}) {
    
  return (
    <div className={`image-avatar w-${width}`} style={{width:`${width}px` ,height:`${height}px`,zIndex:isActive?'10':zIndex,transform:`translateX(-${(zIndex-1)*5}px)`}} onClick={()=>{onClick()}}>
        {isActive?
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 35 35">
  <g id="Ellipse_5" data-name="Ellipse 5" fill="none" stroke="#0048AC" stroke-width="0.5">
    <circle cx="50%" cy="50%" r="50%" stroke="none"/>
    <circle cx="50%" cy="50%" r="50%" fill="none"/>
  </g>
</svg>
:
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 35 35">
<g id="Ellipse_5" data-name="Ellipse 5" fill="none" stroke="#FFFFFF" stroke-width="0.5">
  <circle cx="50%" cy="50%" r="50%" stroke="none"/>
  <circle cx="50%" cy="50%" r="50%" fill="none"/>
</g>
</svg>      
    }
    {isActive&&
    <div className='avatar-text-element'>
        Blue
    </div>
    }
    <div className='shadow-inset-avatar'/>
        <Image src={image} width={width} height={height} alt={alt} objectFit='cover' objectPosition='center' style={{borderRadius:"50%"}}/>
    </div>
  )
}

export default ImageAvatar