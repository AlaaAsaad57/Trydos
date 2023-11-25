"use client"
import React, { useRef,useEffect, useState } from 'react';
import Product from './Product'
import ProductCover from './ProductCover'
import Testavatar from './Testavatar'
// Import Swiper styles
import 'swiper/css';
import "swiper/css/bundle";
import { useSelector } from 'react-redux';
function ProductCard() {
  const [isClicked,setIsClicked]=useState(false)
  const products=useSelector((state)=>state.listing.products)  
  
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
      // let sliderIndex,avatarIndex;
      // if(bool){images.map((s,index)=>{
      //   if(s===i){
      //     avatarIndex=index+1
      //     ref.current.swiper.slideTo(index)
      //   }
      // })}
      // let arr=[];
      // images.filter((im,index)=>im!==i).map((im,index)=>{
      //   if(index===Math.round((images.length)/2)-1){
      //     arr.push(i)
      //   }
      //   arr.push(im)
      // })
      
    }
  return (<>
    <div className='site-container'>
      {products.map((product)=>(
        <Product product={product}/>
      ))}
 {products.map((product)=>(
        <ProductCover product={product}/>
      ))}
    </div>
    </>
  )
}


export default ProductCard