import React,{useRef,useEffect} from 'react'
import { EffectCoverflow } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import BorderImage from './BorderImage';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
function ColorSlider({activeColor,isColorSelected,setActiveColor,getIndex,colors}) {
   const ImageRef=useRef()
    useEffect(()=>{
        if(activeColor&&ImageRef){
            
            ImageRef.current.slideTo(getIndex)
        }
    },[activeColor])
  return (
    <>
        <Swiper  
    modules={[EffectCoverflow]}
    ref={ImageRef}
    onInit={(swiper)=>ImageRef.current=swiper}
    speed={100}
    effect="coverflow"
    style={{display:isColorSelected?'flex':'none'}}
    coverflowEffect={{
        depth:100,
        modifier:1,
        rotate:false,
        scale:0.78,
        stretch:135,
        slideShadows:false
    }}
    slidesPerView={1}
    threshold={1}
    centeredSlides={true}
    onSlideChange={(swiper)=>{
      setActiveColor(colors[swiper.activeIndex]);}}
    initialSlide={getIndex}
    loop={false}
  >
    {colors.map((img,i)=>(
     <SwiperSlide
     key={i}
     style={{
         overflow:"visible",
         position: 'relative'
     }}
   >
        <>
       <BorderImage/>
       <div className='inset-shadow-img'/>
       <Image priority={i===3} style={{borderRadius:'15px',zIndex:'3'}} fill src={img.photos[0]} alt='alt' />
       <Skeleton style={{width:"100%",height:"100%",position:"absolute",top:'0px',left:'0px',borderRadius:'15px',zIndex:'2'}}/>
        </>

  
   </SwiperSlide>
  ))}


  </Swiper>
    </>
  )
}

export default ColorSlider