import React, {useReducer,memo, useEffect } from 'react'
import ImageSlider from "./ImageSlider"
import PriceLabel from './PriceLabel'
import BuyButton from './BuyButton'
import TopSlider from './TopSlider';
import Image from 'next/image';
import Spinner from '../global/Spinner';
import ErrorIcon from "public/svg/ErrorIcon.svg"
import { Img } from 'react-image';
import CategoryPhoto from './CategoryPhoto'
function ProductReducer(state,{type,payload}){
    if (type === 'setActiveTopSlide') {
      return {
        ...state,
        isActiveTopSlide: payload
      };
    }
    if (type === 'setActiveColor') {
    
      return {
        ...state,
        activeColor:{...payload,index:payload.index||0},
        renderVar:!state.renderVar
      };
    }
    if (type === 'setActiveImage') {
      return {
        ...state,
        activeColor: payload,
        renderVar:!state.renderVar
      };
    }
    if (type === 'setColor') {
      return {
        ...state,
        isColorSelected: payload,
      };
    }
  
    throw Error('Unknown action.');
  
  }
function ProductNoColors({product}) {
    const [productState, dispatch] = useReducer(ProductReducer,
        { isActiveTopSlide:false,
         activeColor:{images:product.images},
         activeImage:product.images[0],
         isColorSelected:false,
         activeImageIndex:0,
         renderVar:false
 
       });

   return (
     <div className='product-container' onMouseLeave={()=>{
      if(productState.isActiveTopSlide){
      dispatch({type:'setActiveTopSlide',payload:false});
       }
       }}>
     <div className='blured-background'/>
     <div className='offer-blured'/>
     <div className='offer-blured-background'/>
     {
    <TopSlider 
    name={product.name}
    active={productState.isActiveTopSlide} 
    activeColor={productState.activeColor}
    setActiveColor={(e)=>dispatch({type:'setActiveColor',payload:e})}
    images={product.images}/>}
   {
     <div className='product-photos' style={{position:!productState.isActiveTopSlide?'static':'absolute',opacity:!productState.isActiveTopSlide?'1':'0',zIndex:!productState.isActiveTopSlide?'4':'1'}}>
     <div  className={`product-container-slider ${productState.isColorSelected&& 'selected-color'}`} >
   <>
   {
   
   <ImageSlider 
   renderVar={productState.renderVar} 
   active={(!productState.isActiveTopSlide)}  
   isActiveTopSlide={productState.isActiveTopSlide} 
   setActiveTopSlide={(e)=>dispatch({type:'setActiveTopSlide',payload:e})} 
   setColor={(e)=>dispatch({type:'setColor',payload:e})}  
   activeColor={{images:product.images,index:productState.activeColor?.index||0}} 
   isColorSelected={productState.isColorSelected} 
   setActiveImage={(e)=>dispatch({type:'setActiveImage',payload:e})}/>
   }
   </>   
 
     </div>
    {
    <>

    </>
     }
             </div>}
             <div className='product-body' onMouseEnter={()=>dispatch({type:'setColor',payload:false})} onTouchStart={()=>{dispatch({type:'setColor',payload:false});  dispatch({type:"setActiveTopSlide",payload:false});}}>
             {product.brand?.image && 
             <CategoryPhoto
             loader={<Spinner/>}
             unloader={<ErrorIcon/>}
             alt={product.brand.name} width="66" height="10" src={product.brand.image} objectFit='cover' objectPosition='center' 
             style={{borderRadius:'50%'}}
           />
             }
           <div className='prouct-details'>
             <span className='quantity'>1</span>
             {product?.categories?.map((cat)=>(
              <span className='product-category-icon'>
              <CategoryPhoto 
              src={cat.icon}
             loader={<Spinner/>}
             unloader={<ErrorIcon/>}
            width={10} height={10} objectFit='cover' objectPosition='center' alt={cat.name}
            style={{borderRadius:'50%'}}/>
              </span>
          ))}
             <p id={'prod-'+product.id} className='product-details-text'>
             {product.name}
             </p>
           </div>
             </div>
             <div className='product-footer'>
               <PriceLabel offer_price={product.offer_price} price_formatted={product.price_formatted}/>
               <BuyButton/>
             </div>
             </div>
   )
}

export default ProductNoColors