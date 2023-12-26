import Image from 'next/image'
import React, {memo} from 'react'

function ImageAvatar({image,width,height,alt,isActive,name}) {    
  return (
    <div className='image-avatar'>

        {isActive?
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 35 35">
  <g id="Ellipse_5" data-name="Ellipse 5" fill="none" stroke={name==='blue'?"#0048AC":name} strokeWidth="0.5">
    <circle cx="50%" cy="50%" r="50%" stroke="none"/>
    <circle cx="50%" cy="50%" r="50%" fill="none"/>
  </g>
</svg>
:
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 35 35">
<g id="Ellipse_5" data-name="Ellipse 5" fill="none" stroke="#FFFFFF" strokeWidth="0.5">
  <circle cx="50%" cy="50%" r="50%" stroke="none"/>
  <circle cx="50%" cy="50%" r="50%" fill="none"/>
</g>
</svg>      
    }
    {isActive&&
    <div className='avatar-text-element' style={{color:name}}>
        {name}
    </div>
    }
    <div className='shadow-inset-avatar'/>
        <Image  quality={80} src={image} width={width} height={height} alt={alt||'alt'} style={{borderRadius:"50%",zIndex:'3',objectPosition:'center top',objectFit:'cover'}}/>
    </div>
  )
}

export default memo(ImageAvatar)