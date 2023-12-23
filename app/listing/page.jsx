"use server"
import React from 'react'
import ProductCard from '../../components/ListingPage/ProductCard'
import { getHomeData, getStories } from '../../redux/homepage/cachedActions';
 async function page() {
  const [stories,stories_res] = await getStories(); 
  const [HomeData,HomeData_res]=await getHomeData();
  return (
    <>
      {<ProductCard HomeData_res={HomeData_res} stories_res={stories_res} stories={stories} HomeData={HomeData}/>}
    </>
  )
}

export default page