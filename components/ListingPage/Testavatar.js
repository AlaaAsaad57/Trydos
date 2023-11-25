import React, { useRef,useState } from 'react'
import { useSelector } from 'react-redux'
import { EffectCoverflow } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import ImageAvatar from './ImageAvatar'

function Testavatar() {
    const ref=useRef()
    const [activeIndex,setActiveIndex]=useState(3)
    const product =useSelector((state)=>state.listing.products)[0]
    const getSize=(i)=>{
        if((i===activeIndex)||(i===activeIndex&&i===0)) return 35
        else if(i===activeIndex-1||i===activeIndex+1) return 30
        else if(i===activeIndex-2||i===activeIndex+2) return 25
        else if(i===activeIndex-3||i===activeIndex+3) return 20
        else if(i===activeIndex-4||i===activeIndex+4) return 15
        else  return 15
        
        }
  return (
    <div className='slider-test'>
        <Swiper
         modules={[EffectCoverflow]}

         ref={ref}
         className='avatar-slider'
         onSlideChange={(swiper)=>{
            setActiveIndex(swiper.activeIndex);
            }}
         effect="coverflow"
         coverflowEffect={{
             depth:0,
             modifier:1,
             rotate:false,
             stretch:2,
             slideShadows:false
         }}
         observer={true}
         slidesPerView={'auto'}
         centeredSlides={true}
        
         initialSlide={3}
         loop={false}
        >
        {product.colors.map((img,i)=>(
            <SwiperSlide
            style={{
                overflow:"visible",
                position: 'relative'
            }}
          >

               {({ isActive }) => (
  <ImageAvatar 
  className={`w-${getSize(i)}`}
  alt={'alt'}
  width={getSize(i)}
  height={getSize(i)}
  isActive={isActive}
  image={img.photos[0]}
  name={img.name}
  index={i}
  onClick={()=>{}}
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
  )
}

export default Testavatar