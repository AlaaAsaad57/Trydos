import React from 'react'
import StarIcon from "public/svg/starIcon.svg"
import BarDescribtion from "./BarDescribtion"
import { useSelector } from 'react-redux'
import { translate } from 'utils/functions'
function BrandsBar() {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <div className='home-bar' aria-details={language}>
        <StarIcon/>
        <BarDescribtion name={translate("Brands",language)} desc={translate("Best Offers From Brands",language)}/>
    </div>
  )
}

export default BrandsBar