import React,{useRef,useEffect,memo} from 'react'
import { EffectCoverflow } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import BorderImage from './BorderImage';
import Image from 'next/image';
function ColorSlider({active,activeColor,setActiveColor,getIndex,colors,product_name}) {
   const ImageRef=useRef()
    useEffect(()=>{
        if(activeColor&&ImageRef){
            
            ImageRef.current.slideTo(getIndex,300,false)
        }
    },[activeColor])
    const throttleFunc = (e) => {
      e.preventDefault();
      if(e.deltaX>5){
        ImageRef.current.slideNext()
      }
      else if(e.deltaX<0 && Math.abs(e.deltaX)>5){
        ImageRef.current.slidePrev()
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
    <div className={'active-slider '+(active?'sl-active':'sl-deactive')} onWheel={throttle(callback,250)}>
        <Swiper  
        className='color-swiper'
    modules={[EffectCoverflow]}
    ref={ImageRef}
    onInit={(swiper)=>{
      ImageRef.current=swiper}}
    speed={100}
    effect="coverflow"
    coverflowEffect={{
        depth:100,
        modifier:1,
        rotate:false,
        scale:1,
        stretch:145,
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
    {colors.map((img,i)=>(img.images.length>0&&
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
       <Image  priority={i===3} style={{borderRadius:'15px',zIndex:'3'}} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" src={img.images[0]} alt={product_name||'alt'}/>
        </>

  
   </SwiperSlide>
  ))}


  </Swiper>
    </div>
  )
}

export default memo(ColorSlider)