"use server"
import React from 'react'
import ProductCard from 'components/ListingPage/ProductCard'
import {  getHomeData, getListingData, getStories } from 'store/homepage/cachedActions';
export async function generateMetadata({ params, searchParams }) {
    // read route params
    const categories = params.categories
    return {
      title: `Trydos - ${categories}`,
      description:`Trydos ${categories} Page`
    }
  }
 async function page({ params, searchParams }) {
    const [stories,stories_res] = await getStories(); 
    const [HomeData,HomeData_res]=await getHomeData();
  const [Listing_data,Listing_Data_res]=await getListingData()
  
  return (
    <>
      {<ProductCard  Listing_Data_res={Listing_Data_res} HomeData_res={HomeData_res} stories_res={stories_res} stories={stories} HomeData={HomeData}/>}
    </>
  )
}

export default page