import { InView } from 'react-intersection-observer';
import Spinner from '../../global/Spinner';
import { useState } from 'react';
import { useEffect } from 'react';


const Observable = (props) => {
    const [show,setShow]=useState(false)
    useEffect(()=>{
        setTimeout(() => {
            setShow(true)
        }, 2000);
    },[])
    return(
    <>
     {show&& <InView className='spinner-container' as="div" onChange={(inView, entry) => {if(inView&&props.loading){
    props.getNext()
  }}}>
    <h2>{!props.loading&&<Spinner/>}</h2>
  </InView>}
    </>

);}

export default Observable;