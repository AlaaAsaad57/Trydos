"use client"
import React from 'react';
import ProductCover from './ProductCover'
// Import Swiper styles
import 'swiper/css';
import "swiper/css/bundle";
import { useSelector } from 'react-redux';
function ProductCard() {
  const products=useSelector((state)=>state.listing.products)  

  return (<>
    <div className='site-container'>
 {products.map((product,i)=>(
        <ProductCover key={i} index={i} product={product}/>
      ))}
    </div>
    </>
  )
}


export default ProductCard