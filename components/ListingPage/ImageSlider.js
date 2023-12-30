import React, { useEffect,memo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import BorderImage from './BorderImage';
import Image from 'next/image';
import { useRef } from 'react';
import PointsSlider from './PointsSlider';
function ImageSlider({renderVar,product_name,active,isColorSelected,setActiveImage,activeColor,isActiveTopSlide,setActiveTopSlide,setColor}) {
    var ColorRef=useRef()
    useEffect(()=>{
     
      if(activeColor.index>=0){
        ColorRef.current.slideTo(activeColor.index,300,false)
     
      }
    },[activeColor])
  return (
   <>
    <div className={'active-slider '+(active?'sl-active':'sl-deactive')}>
    {!isColorSelected&&
    <PointsSlider 
    colors={activeColor.images} 
    activeIndex={ColorRef.current?.activeIndex||0} 
    isActiveTopSlide={isActiveTopSlide} 
    setActiveTopSlide={()=>{setActiveTopSlide(!isActiveTopSlide); 
    setColor(true)}}/>  }

    <Swiper 
  effect="coverflow"
  coverflowEffect={{
      depth:100,
      modifier:1,
      rotate:false,
      scale:0.78,
      stretch:135,
      slideShadows:false
  }}
  ref={ColorRef}
  threshold={1}
  onInit={(swiper)=>{
    ColorRef.current=swiper}}
  speed={100}
  slidesPerView={1}
  centeredSlides={true}
  onSlideChange={(swiper)=>{
    setActiveImage({...activeColor,index:swiper.activeIndex})
  }}
  initialSlide={activeColor.index}
  loop={false}
>
{activeColor.images.map((img,i)=>(
   <SwiperSlide
   key={i}
   style={{
       overflow:"visible",
       position: 'relative'
   }}
 >
     {({ isActive }) => (
      <>
     <BorderImage isBig={true}/>
     <div className='inset-shadow-img'/>
     <Image sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{borderRadius:'15px',zIndex:'3'}} fill src={img} alt={product_name||'alt'} />
      </>

     )}

 </SwiperSlide>
))}

</Swiper>
  </div>
  
   </>
  )
}

export default memo(ImageSlider)