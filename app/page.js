import Home from '../components/Home'
import { getCategories, getMainSetting, getStories } from '../redux/homepage/cachedActions';
import React from 'react'

async function page() {
  const stories = await getStories(); 
  const [categories,settings]=await getCategories();



  return (
    <>
      <Home stories={stories} categories={categories} settings={settings}/>
    </>
  )
}

export default page