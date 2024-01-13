"use client"
import React,{memo, useEffect} from 'react';
import ProductNoColors from './ProductNoColors'
import ProductCover from './ProductCover'
// Import Swiper styles
import 'swiper/css';
import "swiper/css/bundle";
import { useDispatch, useSelector } from 'react-redux';
import {EventTrack, GetMainData, LogData} from "store/homepage/actions"
import { InView } from 'react-intersection-observer';
import Spinner from '../global/Spinner';
import axios from 'axios';
import { LISTING_INFO_URL, OTP_URL } from 'utils/endpointConfig';
function ProductCard({Listing_Data_res,HomeData_res,stories_res,HomeData}) {

  const dispatch=useDispatch()
  const products=useSelector((state)=>state.listing.products); 
  const offset=useSelector((state)=>state.listing.offset); 
  const loading=useSelector((state)=>state.listing.loading); 
  const isReachEnd=useSelector((state)=>state.listing.isReachEnd);
  const GetNextPage=async()=>{
 
    if(!loading)
    {dispatch({type:"PRODUCT_LOADING"})
    await axios.get(OTP_URL+LISTING_INFO_URL+`?offset=${offset}&limit=${20}`).then((data)=>{
      dispatch({type:"GET_NEXT_PRODUCT",payload:data.data.data})
    })
  }

  }
useEffect(()=>{
  EventTrack()
  LogData({stories_req_data:stories_res,HomeData_req_data:HomeData_res,listing_req_data:Listing_Data_res})
  dispatch(GetMainData(HomeData))
  dispatch({type:'GET_PRODUCTS',payload:Listing_Data_res.body.data})

},[])
  return (<>
    <div className='listing-container'>
 {products.map((product,i)=>(
    <div key={i}>
       {   !product.sync_color_images&&  <ProductNoColors   product={product}/>}
      {product.sync_color_images&&  <ProductCover   product={product}/>}
    </div>

      ))}

    </div>
    <div className='get-next-product'>
   {!isReachEnd?<> {!loading? <InView className='spinner-container' as="div" onChange={(inView, entry) => {
    if(inView&&!loading){
   GetNextPage()
  }}}>

  </InView>:
      <h2>{loading&&<Spinner/>}</h2>}</>:<>Reach End</>}
    </div>
    </>
  )
}


export default memo(ProductCard)