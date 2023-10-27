import React from 'react'
import CategoryIcon from "../../../public/svg/categoryIcon.svg";
import BarDescribtion from "./BarDescribtion";
function CategoryBar() {
  return (
    <div className='home-bar'>
    <CategoryIcon/>
    <BarDescribtion name={"Category"} desc={"Enjoy Shopping From All Categories & Products From Various Brands"}/>
  </div>
  )
}

export default CategoryBar