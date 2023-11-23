"use client"
import React, { useRef,useEffect, useState } from 'react'
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import "swiper/css/bundle";
import { EffectCards } from "swiper";
import BorderImage from './BorderImage'
import PriceLabel from './PriceLabel'
import BuyButton from './BuyButton'
import CoverEffectSlider from "./CoverEffectSlider"
import { image } from '@cloudinary/url-gen/qualifiers/source';
function ProductCard() {
  const [images,setImages]=useState(['/images/1.jpg','/images/2.jpg','/images/3.jpg','/images/22.jpg','/images/33.jpg'])
  const [originalImages,setoriginalImages]=useState(['/images/1.jpg','/images/2.jpg','/images/3.jpg','/images/22.jpg','/images/33.jpg'])
    const ref=useRef()
    const slideTo=(i,bool)=>{

      // let slide=images.filter((s,index)=>s===i)[0];
      // let ele=images.filter((el,index)=>el===i)[0]
      // let arr=[], newIndex
      // images.filter((io,index)=>io!==i).map((im,index)=>{
      //   if(index===Math.round((images.length)/2))
      //   arr.push(ele)
      // arr.push(im)
      // })
      
      // setImages(arr)
      // originalImages.map((m,index)=>{
      //   if(m===slide){
      //     newIndex=index
      //   }
      // })
      // ref.current.swiper.slideTo(newIndex)
      let sliderIndex,avatarIndex;
      if(bool){images.map((s,index)=>{
        if(s===i){
          avatarIndex=index+1
          ref.current.swiper.slideTo(index)
        }
      })}
      let arr=[];
      images.filter((im,index)=>im!==i).map((im,index)=>{
        if(index===Math.round((images.length)/2)-1){
          arr.push(i)
        }
        arr.push(im)
      })
      setoriginalImages(arr)
    }
  return (
    <div className='site-container'>
        <div className='product-container'>
        <div className='offer-blured-background'/>
        <div className='offer-blured'/>
        <div className='product-photos'>
        <div className='product-container-slider'>
        <Swiper ref={ref} 
        modules={[EffectCards]}
        onSlideChange={(swiper)=>{
           slideTo(images[swiper.activeIndex],false);
           }}
        effect="cards"
        cardsEffect={{
            perSlideRotate:0,
            perSlideOffset:10,
            rotate:false
            
        }}
        observer={true}
        slidesPerView={1}
        initialSlide={Math.round((images.length+1)/2)-1}
        loop={false}
        
        onActiveIndexChange={(swiper)=>swiper.loopCreate()}
      >
     {images.map((img)=>(
         <SwiperSlide
         style={{
           backgroundImage:
             `url(${img})`
         }}
       >
           {({ isActive }) => (
           <BorderImage/>
           )}
    
       </SwiperSlide>
     ))}
      </Swiper>
   
        </div>
        <CoverEffectSlider onClick={(e)=>slideTo(e,true)} swiperRef={ref} images={originalImages}/>
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


        
    </div>
  )
}


export default ProductCard