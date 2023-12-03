import React,{useRef,useEffect} from 'react'
import { EffectCoverflow } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import BorderImage from './BorderImage';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
function ColorSlider({active,activeColor,isColorSelected,setActiveColor,getIndex,colors}) {
   const ImageRef=useRef()
    useEffect(()=>{
        if(activeColor&&ImageRef){
            
            ImageRef.current.slideTo(getIndex)
        }
    },[activeColor])
  return (
    <div className={'active-slider '+(active?'sl-active':'sl-deactive')}>
        <Swiper  
    modules={[EffectCoverflow]}
    ref={ImageRef}
    onInit={(swiper)=>ImageRef.current=swiper}
    speed={100}
    effect="coverflow"
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
      setActiveColor({...colors[swiper.activeIndex],index:0});}}
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
       <Image priority={i===3} style={{borderRadius:'15px',zIndex:'3'}} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" src={img.photos[activeColor.index]} alt='alt' />
       <Skeleton style={{width:"100%",height:"100%",position:"absolute",top:'0px',left:'0px',borderRadius:'15px',zIndex:'2'}}/>
        </>

  
   </SwiperSlide>
  ))}


  </Swiper>
    </div>
  )
}

export default ColorSlider