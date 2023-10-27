import React from 'react'
import StarIcon from "../../../public/svg/starIcon.svg"
import BarDescribtion from "./BarDescribtion"
function BrandsBar() {
  return (
    <div className='home-bar'>
        <StarIcon/>
        <BarDescribtion name={"Brands"} desc={"Best Offers From Brands"}/>
    </div>
  )
}

export default BrandsBar