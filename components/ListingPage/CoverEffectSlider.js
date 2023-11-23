import React, { useRef } from 'react'
import ImageAvatar from './ImageAvatar'
function CoverEffectSlider({images,swiperRef,onClick}) {

   const getSize=(i)=>{
    if(i===Math.round(images.length/2)) return (35)
    if(i===Math.round(images.length/2)-4||i===Math.round(images.length/2)+4) return (15)
    if(i===Math.round(images.length/2)-3||i===Math.round(images.length/2)+3) return (20)
    if(i===Math.round(images.length/2)-2||i===Math.round(images.length/2)+2) return (25)
    if(i===Math.round(images.length/2)-1||i===Math.round(images.length/2)+1) return (30)
    
   }
  return (
       <div className='product-photos-slider'>
        {images.map((img,index)=>(
          <ImageAvatar onClick={()=>onClick(img)} swiperRef={swiperRef} index={index} isActive={index+1===Math.round(images.length/2)} zIndex={index+1} image={img} width={getSize(index+1)} height={getSize(index+1)} alt={'Alt'} />
        ))}
   
        </div>
    
  )
}

export default CoverEffectSlider