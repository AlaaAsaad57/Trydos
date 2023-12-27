"use client"
import React,{memo, useEffect} from 'react';
import ProductNoColors from './ProductNoColors'
import ProductCover from './ProductCover'
// Import Swiper styles
import 'swiper/css';
import "swiper/css/bundle";
import { useDispatch, useSelector } from 'react-redux';
import {EventTrack, LogData} from "../../redux/homepage/actions"
function ProductCard({Listing_data,Listing_Data_res,HomeData_res,stories_res}) {

  const dispatch=useDispatch()
  const products=useSelector((state)=>state.listing.products)  
useEffect(()=>{
  EventTrack()
  dispatch({type:'GET_PRODUCTS',payload:Listing_Data_res.body.data.products})
  LogData({stories_req_data:stories_res,HomeData_req_data:HomeData_res,listing_req_data:Listing_Data_res})
},[])
  return (<>
    <div className='listing-container'>
 {products.map((product,i)=>(
    <>
       {   !product.sync_color_images&&  <ProductNoColors  product={product}/>}
      {product.sync_color_images&&  <ProductCover  product={product}/>}
    </>

      ))}
    </div>
    </>
  )
}


export default memo(ProductCard)