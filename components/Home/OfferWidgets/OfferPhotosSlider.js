import React from 'react'
import OfferSlideItem from "./OfferSlideItem"
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import OfferAvatars from './OfferAvatars';
function OfferPhotosSlider({OfferPhotos,extended}) {
    var settings = {
        dots: false,
        arrows:false,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        slide:null,
        centerPadding: "10px",
        centerMode: true,
      };
  return (
    <div className='offer-slider-container' style={{marginTop:extended&&"39px"}}>
    <Slider {...settings} >

    {OfferPhotos.map((offerPhoto,key)=>(
       
        <OfferSlideItem key={key}/>

     
    ))}

    </Slider>
                <OfferAvatars/>
    </div>
  )
}

export default OfferPhotosSlider