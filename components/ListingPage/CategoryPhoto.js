import React, { useState } from 'react'
import ErrorIcon  from 'public/svg/ErrorIcon.svg'
import { Img } from 'react-image';
import Spinner from '../global/Spinner';
function CategoryPhoto(props) {
    const [reload,setReload] =useState(true);
    const [src,setSrc] =useState(props.src);
 const   onClick=()=>{
    setReload(false);
    setTimeout(() => {
        setSrc(props.src+`?t=${new Date().getTime()}`)
        setReload(true)
    }, 1000);
 }
  return (
    <>
    {reload? <Img
    {...props}
    src={[src]}
    unloader={<ErrorIcon onClick={()=>onClick()}/>}
  />:<Spinner/>}
    </>
  )
}

export default CategoryPhoto