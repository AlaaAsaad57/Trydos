import React, { useRef, useState,useEffect } from 'react'
import ImageAvatar from './ImageAvatar'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from "swiper/modules";
function CoverEffectSlider({images,active,activeColor,setActiveColor,setColor,isColorSelected}) {
  const [activeIndex,setActive]=useState(images.findIndex((element)=>element.name===activeColor.name))
const ref=useRef()
const getSize=(i)=>{
if((i===activeIndex)||(i===activeIndex&&i===0)) return 35
else if(i===activeIndex-1||i===activeIndex+1) return 30
else if(i===activeIndex-2||i===activeIndex+2) return 25
else if(i===activeIndex-3||i===activeIndex+3) return 20
else if(i===activeIndex-4||i===activeIndex+4) return 15
else  return 15

}
useEffect(() => {
  if(isColorSelected){
    ref.current.enable()
  }
  else{
    ref.current.disable()
  }

 
}, [isColorSelected])
useEffect(()=>{
  if(ref.current){
    
    ref.current.slideTo(images.findIndex((element)=>element.name===activeColor.name))
  }

},[activeColor])
  return (
    <div  className={'product-photos-slider'} style={{opacity:active?'1':'0',zIndex:active?'10':'1'}}  onMouseEnter={()=>setColor(true)} onClick={()=>setColor(!isColorSelected)}>
   <Swiper

         modules={[EffectCoverflow]}
         enabled={false}
         onInit={(swiper)=>ref.current=swiper}
         className='avatar-slider'
         onSlideChange={(swiper)=>{
            setActive(swiper.activeIndex);
            setActiveColor({...images[swiper.activeIndex],index:0});
            }}
        slideToClickedSlide={true}
         effect="coverflow"
         threshold={0}

         coverflowEffect={{
             depth:0,
             modifier:1,
             rotate:false,
             stretch:2,
             slideShadows:false
         }}
         slidesPerView={'auto'}
         centeredSlides={true}
         initialSlide={3}
        
         resistanceRatio={0}
         virtualTranslate={false}
        >
        {images.map((img,i)=>(
            <SwiperSlide
            key={i}
            onTouchStart={(swiper)=>{
             setActive(i)
             setActiveColor(images[i])
            }}
            onClick={(swiper)=>{
              setActive(i)
              setActiveColor(images[i])
             }}
            className={`image-avatar w-${getSize(i)}`} style={{width:`${getSize(i)-(((i+1)-1)*5)}px` ,height:`${getSize(i)-(((i+1)-1)*5)}px`,zIndex:activeIndex===i?'10':(i+1),translate:`-${((i+1)-1)*5}px, 0px`,           overflow:"visible",
            position: 'relative'}}

          >

               {({ isActive}) => (

  <ImageAvatar 
  className={`w-${getSize(i)}`}
  alt={'alt'}
  width={getSize(i)}
  height={getSize(i)}
  swiperRef={ref}
  isActive={activeColor.name===img.name}
  image={img.photos[0]}
  
  name={img.name}
  index={i}
  zIndex={i+1}
  key={i}
  style={{
    backgroundImage:
      `url(${img.photos[0]})`,
    maxWidth: "35px",
    height: "35px",
    borderRadius: "50%",
    backgroundPosition: "cover",
    backgroundSize: "cover",
    transformOrigin:'left center',
    zIndex:activeIndex===i?'10':i
  }}
  ></ImageAvatar>
               )}
          </SwiperSlide>
            
        ))}
        </Swiper>
    </div>
  );

}

export default CoverEffectSlider