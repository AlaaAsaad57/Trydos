import Image from 'next/image'
import React,{useEffect} from 'react'
import Skeleton from 'react-loading-skeleton'

function ImageAvatar({image,width,height,alt,zIndex,isActive,onClick,index,swiperRef,name}) {
    useEffect(() => {
      if(isActive){
        console.log(swiperRef.current)
      swiperRef?.current?.slideTo(index)}
     
    }, [isActive])
    
  return (
    <div className='image-avatar' onClick={()=>{onClick()}}>
       <Skeleton style={{width:"100%",height:"100%",position:"absolute",top:'0px',left:'0px',borderRadius:'50%',zIndex:'2'}}/>

        {isActive?
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 35 35">
  <g id="Ellipse_5" data-name="Ellipse 5" fill="none" stroke={name==='blue'?"#0048AC":name} stroke-width="0.5">
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
    <div className='avatar-text-element' style={{color:name==='blue'?'#0048AC':name}}>
        {name}
    </div>
    }
    <div className='shadow-inset-avatar'/>
        <Image quality={80} src={image} width={width} height={height} alt={alt} objectFit='cover' objectPosition='center' style={{borderRadius:"50%",zIndex:'3'}}/>
    </div>
  )
}

export default ImageAvatar