import React from 'react'
import CategoryIcon from "public/svg/categoryIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { useSelector } from 'react-redux';
import { translate } from 'utils/functions';
function CategoryBar() {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <div className='home-bar' aria-details={language}>
    <CategoryIcon/>
    <BarDescribtion name={translate("Category",language)} desc={translate("Enjoy Shopping From All Categories & Products From Various Brands",language)}/>
  </div>
  )
}

export default CategoryBar