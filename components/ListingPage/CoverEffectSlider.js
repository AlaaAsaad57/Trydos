import React, { useRef, useState,useEffect,memo } from 'react'
import ImageAvatar from './ImageAvatar'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from "swiper/modules";
function CoverEffectSlider({images,active,activeColor,setActiveColor,setColor,isColorSelected,product_name}) {
  const [activeIndex,setActive]=useState(images.findIndex((element)=>element.color_name===activeColor.color_name))
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
    
    ref.current.slideTo(images.findIndex((element)=>element.color_name===activeColor.color_name),300,false)
  }

},[activeColor])
const throttleFunc = (e) => {
  e.preventDefault();
	if(e.deltaX>5){
    ref.current.slideNext()
  
  }
  else if(e.deltaX<0 && Math.abs(e.deltaX)>5){
    
    ref.current.slidePrev()
  }
}
function throttle(fn, wait) {
  var time = Date.now();

  return function(event) {
    // we dismiss every wheel event with deltaY less than 4
    if (Math.abs(event.deltaX) < 4) return

    if ((time + wait - Date.now()) < 0) {
      fn(event);
      time = Date.now();
    }
  }
}

function callback(event) {
 throttleFunc(event)
}
  return (
    <div  className={'product-photos-slider'} onWheel={throttle(callback,250)} style={{opacity:active?'1':'0',zIndex:active?'10':'1'}}  onMouseEnter={()=>setColor(true)} onClick={()=>setColor(!isColorSelected)}>
   <Swiper

         modules={[EffectCoverflow]}
         enabled={false}
         onInit={(swiper)=>{
          ref.current=swiper}}
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
  width={getSize(i)}
  height={getSize(i)}
  isActive={activeColor.color_name===img.color_name}
  image={img.images[0]}
  name={img.color_name}
  alt={product_name}
  ></ImageAvatar>
               )}
          </SwiperSlide>
            
        ))}
        </Swiper>
    </div>
  );

}

export default memo(CoverEffectSlider)