"use client"
import React,{memo} from 'react';
import ProductCover from './ProductCover'
// Import Swiper styles
import 'swiper/css';
import "swiper/css/bundle";
import { useSelector } from 'react-redux';
function ProductCard() {
  const products=useSelector((state)=>state.listing.products)  

  return (<>
    <div className='site-container listing-container'>
 {new Array(1).fill(products[0]).map((product,i)=>(
        <ProductCover  product={product}/>
      ))}
    </div>
    </>
  )
}


export default memo(ProductCard)