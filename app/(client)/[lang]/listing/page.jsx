"use server"
import React from 'react'
import ProductCard from 'components/ListingPage/ProductCard'
import { getHomeData, getListingData, getStories } from 'store/homepage/cachedActions';
 async function page() {
  const [stories,stories_res] = await getStories(); 
  const [HomeData,HomeData_res]=await getHomeData();
  const [Listing_data,Listing_Data_res]=await getListingData()
  
  return (
    <>
      {<ProductCard Listing_data={Listing_data} Listing_Data_res={Listing_Data_res} HomeData_res={HomeData_res} stories_res={stories_res} stories={stories} HomeData={HomeData}/>}
    </>
  )
}

export default page