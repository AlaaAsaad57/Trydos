import React, { useRef, useState } from 'react'
import { EffectCards } from "swiper";
import BorderImage from './BorderImage'
import PriceLabel from './PriceLabel'
import BuyButton from './BuyButton'
import TopSlider from "./TopSlider"
import CoverEffectSlider from "./CoverEffectSlider"
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import '../../styles/skeleton.css'
function Product({product}) {
 
    const [isActiveTopSlide,setActiveTopSlide]=useState(false)
    const ref=useRef()
    const [activeColor,setActiveColor]=useState(product.colors[Math.round(product.colors.length/2)-1])
  return (
    <div className='product-container' onMouseLeave={()=>setActiveTopSlide(false)}>
    <div className='offer-blured-background'/>
    <div className='offer-blured'/>
    {isActiveTopSlide&&<TopSlider images={activeColor.photos} goToSlide={(e)=>ref.current.swiper.slideTo(e)}/>}
    <div className='product-photos'>
    <div className='product-container-slider' >
{!isActiveTopSlide&&        <div className='top-slider-enable' onClick={()=>setActiveTopSlide(!isActiveTopSlide)}>
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="44" height="24" viewBox="0 0 44 24">
  <defs>
    <filter id="Ellipse_4" x="24" y="2" width="20" height="20" filterUnits="userSpaceOnUse">
      <feOffset dy="3" input="SourceAlpha"/>
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feFlood flood-opacity="0.2"/>
      <feComposite operator="in" in2="blur"/>
      <feComposite in="SourceGraphic"/>
    </filter>
    <filter id="Ellipse_3" x="18" y="1" width="22" height="22" filterUnits="userSpaceOnUse">
      <feOffset dy="3" input="SourceAlpha"/>
      <feGaussianBlur stdDeviation="3" result="blur-2"/>
      <feFlood flood-opacity="0.2"/>
      <feComposite operator="in" in2="blur-2"/>
      <feComposite in="SourceGraphic"/>
    </filter>
    <linearGradient id="linear-gradient" x1="0.5" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#f53c3c"/>
      <stop offset="1" stop-color="#ff9696"/>
    </linearGradient>
    <filter id="Path_21435" x="10" y="0" width="24" height="24" filterUnits="userSpaceOnUse">
      <feOffset dy="3" input="SourceAlpha"/>
      <feGaussianBlur stdDeviation="3" result="blur-3"/>
      <feFlood flood-opacity="0.2"/>
      <feComposite operator="in" in2="blur-3"/>
      <feComposite in="SourceGraphic"/>
    </filter>
    <filter id="Ellipse_4-2" x="4" y="1" width="22" height="22" filterUnits="userSpaceOnUse">
      <feOffset dy="3" input="SourceAlpha"/>
      <feGaussianBlur stdDeviation="3" result="blur-4"/>
      <feFlood flood-opacity="0.2"/>
      <feComposite operator="in" in2="blur-4"/>
      <feComposite in="SourceGraphic"/>
    </filter>
    <filter id="Ellipse_3-2" x="0" y="2" width="20" height="20" filterUnits="userSpaceOnUse">
      <feOffset dy="3" input="SourceAlpha"/>
      <feGaussianBlur stdDeviation="3" result="blur-5"/>
      <feFlood flood-opacity="0.2"/>
      <feComposite operator="in" in2="blur-5"/>
      <feComposite in="SourceGraphic"/>
    </filter>
  </defs>
  <g id="Group_10983" data-name="Group 10983" transform="translate(-88 -449)">
    <g transform="matrix(1, 0, 0, 1, 88, 449)" filter="url(#Ellipse_4)">
      <g id="Ellipse_4-3" data-name="Ellipse 4" transform="translate(33 8)" fill="none" stroke="#3c3c3c" stroke-width="0.3">
        <circle cx="1" cy="1" r="1" stroke="none"/>
        <circle cx="1" cy="1" r="0.85" fill="none"/>
      </g>
    </g>
    <g transform="matrix(1, 0, 0, 1, 88, 449)" filter="url(#Ellipse_3)">
      <g id="Ellipse_3-3" data-name="Ellipse 3" transform="translate(27 7)" fill="none" stroke="#3c3c3c" stroke-width="0.3">
        <circle cx="2" cy="2" r="2" stroke="none"/>
        <circle cx="2" cy="2" r="1.85" fill="none"/>
      </g>
    </g>
    <g transform="matrix(1, 0, 0, 1, 88, 449)" filter="url(#Path_21435)">
      <g id="Path_21435-2" data-name="Path 21435" transform="translate(19 6)" fill="url(#linear-gradient)">
        <path d="M 3 5.849999904632568 C 1.428500056266785 5.849999904632568 0.1500000059604645 4.571499824523926 0.1500000059604645 3 C 0.1500000059604645 1.428500056266785 1.428500056266785 0.1500000059604645 3 0.1500000059604645 C 4.571499824523926 0.1500000059604645 5.849999904632568 1.428500056266785 5.849999904632568 3 C 5.849999904632568 4.571499824523926 4.571499824523926 5.849999904632568 3 5.849999904632568 Z" stroke="none"/>
        <path d="M 3 0.3000001907348633 C 1.511209964752197 0.3000001907348633 0.3000001907348633 1.511209964752197 0.3000001907348633 3 C 0.3000001907348633 4.488790035247803 1.511209964752197 5.699999809265137 3 5.699999809265137 C 4.488790035247803 5.699999809265137 5.699999809265137 4.488790035247803 5.699999809265137 3 C 5.699999809265137 1.511209964752197 4.488790035247803 0.3000001907348633 3 0.3000001907348633 M 3 0 C 4.65684986114502 0 6 1.34315013885498 6 3 C 6 4.65684986114502 4.65684986114502 6 3 6 C 1.34315013885498 6 0 4.65684986114502 0 3 C 0 1.34315013885498 1.34315013885498 0 3 0 Z" stroke="none" fill="#3c3c3c"/>
      </g>
    </g>
    <g transform="matrix(1, 0, 0, 1, 88, 449)" filter="url(#Ellipse_4-2)">
      <g id="Ellipse_4-4" data-name="Ellipse 4" transform="translate(13 7)" fill="none" stroke="#3c3c3c" stroke-width="0.3">
        <circle cx="2" cy="2" r="2" stroke="none"/>
        <circle cx="2" cy="2" r="1.85" fill="none"/>
      </g>
    </g>
    <g transform="matrix(1, 0, 0, 1, 88, 449)" filter="url(#Ellipse_3-2)">
      <g id="Ellipse_3-4" data-name="Ellipse 3" transform="translate(9 8)" fill="none" stroke="#3c3c3c" stroke-width="0.3">
        <circle cx="1" cy="1" r="1" stroke="none"/>
        <circle cx="1" cy="1" r="0.85" fill="none"/>
      </g>
    </g>
  </g>
        </svg>
                </div>}
    <Swiper ref={ref} 
    modules={[EffectCards]}
    // onSlideChange={(swiper)=>{
    //    slideTo(activeColor.photos[swiper.activeIndex],false);
    //    }}
    effect="cards"
    cardsEffect={{
        perSlideRotate:0,
        perSlideOffset:10,
        rotate:false
        
    }}
    observer={true}
    slidesPerView={1}
    initialSlide={0}
    loop={false}
    
    onActiveIndexChange={(swiper)=>swiper.loopCreate()}
  >
  {activeColor.photos.map((img)=>(
     <SwiperSlide
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
  
    </div>
   {!isActiveTopSlide&& <CoverEffectSlider activeColor={activeColor} setActiveColor={(e)=>setActiveColor(e)} onClick={(e)=>slideTo(e,true)} swiperRef={ref} images={product.colors}/>}
            </div>
            <div className='product-body'>
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="66.341" height="10" viewBox="0 0 66.341 10">
            <g id="Mask_Group_330" data-name="Mask Group 330" transform="translate(0 -0.239)" clip-path="url(#clip-path)">
              <g id="XMLID_10_" transform="translate(0 0.402)" opacity="0.749">
                <g id="XMLID_21_" transform="translate(0 0.272)">
                  <path id="XMLID_8_" d="M7.068,5.279l.944,1.463,1.9-2.954v6.542h1.637V.814H9.88Z" transform="translate(-0.817 -0.814)" fill="#1a171b"/>
                  <path id="XMLID_7_" d="M2.473.814H.817v9.516H2.46V3.787L6.187,9.595l.95-1.482Z" transform="translate(-0.817 -0.814)" fill="#1a171b"/>
                </g>
                <g id="XMLID_19_" transform="translate(12.308 0.272)">
                  <path id="XMLID_6_" d="M21.4,7.378l1.517,2.951h1.973L19.933.814h-1.78l0,0,2.483,5.044h-3.3L18.2,4.218l-.9-1.789-4.174,7.9h1.846l1.561-2.948Z" transform="translate(-13.125 -0.814)" fill="#1a171b"/>
                </g>
                <g id="XMLID_16_" transform="translate(25.408 0.272)">
                  <path id="XMLID_5_" d="M35.82.814H34.177v4.62L35.82,7.042Z" transform="translate(-26.225 -0.814)" fill="#1a171b"/>
                  <path id="XMLID_4_" d="M27.894.814H26.225v9.516h1.643V3.217L34.6,10.329H35.82V9.174Z" transform="translate(-26.225 -0.814)" fill="#1a171b"/>
                </g>
                <g id="XMLID_13_" transform="translate(37.099 0.063)">
                  <path id="XMLID_3_" d="M47.293,3.455a4.7,4.7,0,0,0-3.341-1.3c-2.16,0-3.942,1.292-4.227,2.967H37.916C38.154,2.521,40.883.6,43.974.6a6.624,6.624,0,0,1,4.6,1.742L47.293,3.455Z" transform="translate(-37.916 -0.605)" fill="#1a171b"/>
                  <path id="XMLID_2_" d="M43.8,9a4.176,4.176,0,0,1-3.908-2.283H38.049c.611,2.3,3.008,3.825,5.855,3.825a9.215,9.215,0,0,0,2.052-.215c1.425-.345,2.983-1.248,2.983-2.673V5.123H43.784l0,1.593h3.512v.722c0,.8-1.225,1.26-1.973,1.422A6.74,6.74,0,0,1,43.984,9H43.8Z" transform="translate(-37.916 -0.605)" fill="#1a171b"/>
                </g>
                <g id="XMLID_11_" transform="translate(49.902)">
                  <path id="XMLID_1_" d="M62.514,5.579c0-2.837-2.644-5.038-5.89-5.038-3.144,0-5.906,2.1-5.906,4.886,0,2.628,2.169,4.734,5.089,5.066V8.9a3.678,3.678,0,0,1-3.357-3.372c0-1.9,1.859-3.439,4.148-3.439s4.148,1.542,4.148,3.439A3.671,3.671,0,0,1,57.435,8.9v1.593c2.809-.332,5.079-2.359,5.079-4.911Z" transform="translate(-50.719 -0.541)" fill="#1a171b"/>
                </g>
              </g>
            </g>
          </svg>
          <div className='prouct-details'>
            <span className='quantity'>1</span>
            <span className='product-category-icon'>
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 10 10">
            <g id="Mask_Group_329" data-name="Mask Group 329" transform="translate(0 -0.239)" clip-path="url(#clip-path)">
              <g id="dress" transform="translate(1.307 1.402)">
                <path id="Path_14636" data-name="Path 14636" d="M87.908,11.8l.684-.429A2.8,2.8,0,0,0,89.674,10.1a.2.2,0,0,1,.386.111l-.278,1.778a2.009,2.009,0,0,1-.923,1.4h-1.9a2.009,2.009,0,0,1-.923-1.4l-.278-1.778a.2.2,0,0,1,.386-.111,2.8,2.8,0,0,0,1.082,1.266l.684.429" transform="translate(-84.216 -9.959)" fill="#5d5d5d"/>
                <path id="Path_14637" data-name="Path 14637" d="M14.622,177.67l2.744,6.264a1.044,1.044,0,0,0-1.477,0,1.044,1.044,0,0,1-1.477,0,1.044,1.044,0,0,0-1.477,0,1.044,1.044,0,0,1-1.477,0,1.044,1.044,0,0,0-1.477,0l2.746-6.264Zm0,0" transform="translate(-9.979 -174.241)" fill="#5d5d5d"/>
              </g>
            </g>
          </svg>
            </span>
            <span className='product-details-text'>
            Amazing blue night dress long with 4 buckets
            </span>
          </div>
            </div>
            <div className='product-footer'>
              <PriceLabel/>
              <BuyButton/>
            </div>
            </div>
  )
}

export default Product