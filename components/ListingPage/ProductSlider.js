import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import BorderImage from './BorderImage';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import { useEffect } from 'react';
import { useRef } from 'react';
import PointsSlider from './PointsSlider';
import { EffectCoverflow } from 'swiper/modules';
function ProductSlider({renderVar,setActiveImage,activeColor,setActiveColor}) {
   const ColorRef=useRef()
    useEffect(()=>{
        if(activeColor&&activeColor.index >=0){
          ColorRef?.current?.slideTo(activeColor.index)
        }
      },[renderVar,activeColor])
  return (
    <>
<>
      <Swiper 
  effect="coverflow"
  modules={[EffectCoverflow]}
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
  onInit={(swiper)=>ColorRef.current=swiper}
  speed={100}

  slidesPerView={1}
  centeredSlides={true}
  onSlideChange={(swiper)=>{
    setActiveColor({...activeColor,index:swiper.activeIndex})
  }}
  initialSlide={0}
  loop={false}
>
{activeColor.photos.map((img,i)=>(
   <SwiperSlide
   key={i}
   style={{
       overflow:"visible",
       position: 'relative'
   }}
 >
     {({ isActive }) => (
      <>
     <BorderImage/>
     <div className='inset-shadow-img'/>
     <Image style={{borderRadius:'15px',zIndex:'3'}} fill src={img} alt='alt' />
     <Skeleton style={{width:"100%",height:"100%",position:"absolute",top:'0px',left:'0px',borderRadius:'15px',zIndex:'2'}}/>
      </>

     )}

 </SwiperSlide>
))}

</Swiper>
  </>
    </>
  )
}

export default ProductSlider