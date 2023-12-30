import React,{useEffect,useRef,memo} from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import BorderImage from './BorderImage';
import Image from 'next/image';
import { EffectCoverflow } from 'swiper/modules';
function ProductSlider({activeColor,setActiveColor,product_name}) {
   const ColorRef=useRef()
    useEffect(()=>{
        if(activeColor&&activeColor.index >=0){
          ColorRef?.current?.slideTo(activeColor.index,300,false)
        }
      },[activeColor])
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
  onInit={(swiper)=>{
    ColorRef.current=swiper}}
  speed={100}

  slidesPerView={1}
  centeredSlides={true}
  onSlideChange={(swiper)=>{
    setActiveColor({...activeColor,index:swiper.activeIndex})
  }}
  initialSlide={0}
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
     <BorderImage/>
     <div className='inset-shadow-img'/>
     <Image sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{borderRadius:'15px',zIndex:'3'}} fill src={img} alt={product_name||'alt'} />
      </>

     )}

 </SwiperSlide>
))}

</Swiper>
  </>
    </>
  )
}

export default memo(ProductSlider)