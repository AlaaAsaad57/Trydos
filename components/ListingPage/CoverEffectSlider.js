import React, { useEffect, useRef, useState } from 'react'
import ImageAvatar from './ImageAvatar'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from "swiper";
function CoverEffectSlider({images,swiperRef,onClick,activeColor,setActiveColor}) {
  const [activeIndex,setActive]=useState(images.findIndex((element)=>element.name===activeColor.name))
  var [isDown,setDown]=useState(false)
  const handleMove=(e)=>{
    let elementWidth=ref.current.clientWidth
    let elemnts= Array.from(ref.current.children)
   let clientX=e.clientX || e.touches[0].clientX
    let Xmove=Math.abs(((clientX-ref.current.getBoundingClientRect().left)*100)/ref.current.clientWidth)
    let index= parseInt(Xmove/((100/elemnts.length)))
    index=elemnts.length-index
    if(elemnts[index]){
      setActive(index)
      setActiveColor(images[index])
    }
  }
  const handleMoveMouse=(e)=>{
    if(isDown){
     
       let elementWidth=ref.current.clientWidth
    let elemnts= Array.from(ref.current.children)
   let clientX=e.clientX || e.touches[0].clientX
    let Xmove=Math.abs(((ref.current.getBoundingClientRect().left-clientX)*100)/ref.current.clientWidth)
    let index= parseInt(Xmove/((100/elemnts.length)))
    index=elemnts.length-1-index
    if(elemnts[index]){
     setActiveColor(images[index])
      setActive(index)
    }}
  }
  useEffect(()=>{

  },[])
  const handleEnd=()=>{
    setDown(false);
  }

const ref=useRef()
  //  const getSize=(i)=>{
  //   if(i===Math.round(images.length/2)) return (35)
  //   if(i===Math.round(images.length/2)-4||i===Math.round(images.length/2)+4) return (15)
  //   if(i===Math.round(images.length/2)-3||i===Math.round(images.length/2)+3) return (20)
  //   if(i===Math.round(images.length/2)-2||i===Math.round(images.length/2)+2) return (25)
  //   if(i===Math.round(images.length/2)-1||i===Math.round(images.length/2)+1) return (30)
    
  //  }
const getSize=(i)=>{
if((i===activeIndex)||(i===activeIndex&&i===0)) return 35
else if(i===activeIndex-1||i===activeIndex+1) return 30
else if(i===activeIndex-2||i===activeIndex+2) return 25
else if(i===activeIndex-3||i===activeIndex+3) return 20
else if(i===activeIndex-4||i===activeIndex+4) return 15
else  return 15

}
  return (
    <div ref={ref} className='product-photos-slider'  >
   <Swiper
         modules={[EffectCoverflow]}

         ref={ref}
         className='avatar-slider'
         onSlideChange={(swiper)=>{
            setActive(swiper.activeIndex);
            setActiveColor(images[swiper.activeIndex])
            }}
            slideToClickedSlide={true}
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
        {images.map((img,i)=>(
            <SwiperSlide
            onClick={(swiper)=>{
             setActive(i)
             setActiveColor(images[i])
            }}
            className={`image-avatar w-${getSize(i)}`} style={{width:`${getSize(i)-(((i+1)-1)*5)}px` ,height:`${getSize(i)-(((i+1)-1)*5)}px`,zIndex:activeIndex===i?'10':(i+1),translate:`-${((i+1)-1)*5}px, 0px`,           overflow:"visible",
            position: 'relative'}}

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
  );

}

export default CoverEffectSlider