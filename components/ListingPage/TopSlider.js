import Image from 'next/image';
import React, { useEffect,useState } from 'react'
import Skeleton from 'react-loading-skeleton';
import ProductSlider from './ProductSlider';
function TopSlider({images,activeColor,activeImage,setActiveColor}) {
    const [index,setIndex]=useState(0);
      useEffect(() => {
        if (typeof document !== 'undefined'){
            const slider = document?.querySelector('.top-slider');
          let isDown = false;
          let startX;
          let scrollLeft;
          
          slider?.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
          });
          slider?.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
          });
          slider?.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
          });
          slider?.addEventListener('mousemove', (e) => {
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 3; //scroll-fast
            slider.scrollLeft = scrollLeft - walk;
          });}
      
        
      }, [])

  return (
    <>
     <div className='top-slider'>
        {images.map((img,index)=>(
            <div className='top-slider-element' onClick={()=>setIndex(index)}>
       <Skeleton style={{width:"100%",height:"100%",position:"absolute",top:'0px',left:'0px',borderRadius:'8px',zIndex:'2'}}/>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40" style={{zIndex:'4'}}>
            <g id="Rectangle_4754" data-name="Rectangle 4754" fill="none" stroke="#fefefe" strokeWidth="0.5">
                <rect width="30" height="40" rx="8" stroke="none"/>
                <rect x="0.25" y="0.25" width="29.5" height="39.5" rx="7.75" fill="none"/>
            </g>
            </svg>
            <Image style={{zIndex:'3'}}  src={img} width={30} height={40} alt='alt' loading='lazy' objectFit='cover' objectPosition='center'/>
            </div>
        ))}
    </div>
    <div className='product-photos'>
    <div className={`product-container-slider ${'selected-color'}`} >
    <ProductSlider  index={index} activeImage={activeImage} setActiveTopSlide={(e)=>setActiveTopSlide(e)} setColor={(e)=>setColor(e)}  activeColor={activeColor}   setActiveImage={(i)=>setActiveColor({...activeColor,index:i})}/>
          </div>
          </div>
    </>
   
  )
}

export default TopSlider