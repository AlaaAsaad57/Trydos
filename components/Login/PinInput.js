
import { ReInitialise } from 'store/auth/actions';
import React, { use, useEffect, useState } from 'react'
import PinInput from "react-pin-input";
import { useDispatch, useSelector } from 'react-redux';
function PinInputs({disabled,LoginSuccess,Login,rerender,setRender,onFailedLogin}) {
    const dispatch=useDispatch()
    const [pin,setPin]=useState('')
 
    const user=useSelector((state)=>state.auth.user)
    const language=useSelector((state)=>state.homepage.language)
    const failedLogin=useSelector((state)=>state.auth.failedLogin)
    const wrongNumber=useSelector((state)=>state.auth.wrongNumber)
    const Submit=(value)=>{
        Login(value)
    }
    useEffect(()=>{
       
        if(user&&!failedLogin){
            let elements=document.querySelectorAll('.pin-border-element');
            elements.forEach((element)=>{
                element.classList.add('input-success')
                
            })
           
            setTimeout(() => {
                LoginSuccess()
                dispatch(ReInitialise())
                setPin('')
                document.querySelectorAll('.pincode-input-text').forEach((element)=>{ element.blur(); element.value=''; })
                
                document.querySelectorAll('.pincode-input-text').forEach((element)=>{element.value=''; })
                setRender(false)
            }, 3000);
            setTimeout(() => {
                setRender(true)
                document.querySelectorAll('.pincode-input-text')[0]?.focus()
            }, 2000);
        }
        else if(failedLogin&&!user){
            let elements=document.querySelectorAll('.pin-border-element');
            elements.forEach((element)=>{
                element.classList.add('input-failed')
                setTimeout(() => {
                    element.classList.remove('input-failed')
                }, 1000);
            })
            setTimeout(() => {
                dispatch(ReInitialise())
                setPin('')
                document.querySelectorAll('.pincode-input-text').forEach((element)=>{ element.blur(); element.value=''; })
                
                document.querySelectorAll('.pincode-input-text').forEach((element)=>{element.value=''; })
                setRender(false)
            }, 1400);
            onFailedLogin()
            setTimeout(() => {
                setRender(true)
                document.querySelectorAll('.pincode-input-text')[0]?.focus()
            }, 2000);
            
        }
    },[user,failedLogin])
  return (
    <div aria-details={language}className='pin-inputs-container'>
        <div aria-details={language}className='pin-border-container' style={{zIndex:"1"}}>
        {Array(6).fill(1).map((e,index)=>(
            <div aria-details={language} className={'pin-border-element'+' '+(user?.id&&'input-success')+' '+((wrongNumber||failedLogin)&&!user&&'input-failed')} style={{backgroundColor:(pin[index]||disabled)?'#f5f5f5':'#fafafa',borderRadius:"15px"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" style={{opacity:(pin[index]||disabled)?'0':'1'}}>
                <g id="Rectangle_4722" data-name="Rectangle 4722" fill={user?"none":"#fafafa"} stroke="#4d84ff" strokeLinecap="round" stroke-linejoin="round" strokeWidth="0.5" strokeDasharray="3 3">
                    <rect width="50" height="50" rx="15" stroke="none"/>
                    <rect x="0.25" y="0.25" width="49.5" height="49.5" rx="14.75" fill="none"/>
                </g>
                </svg>

            </div>
        ))}
        </div>
        
{rerender &&
              <PinInput id='pins2'
                length={6}
                initialValue={pin}
                onChange={(value, index) => {
                  setPin(value);
                 
                }}
                type="numeric"
                disabled={disabled}
                inputMode="number"
                placeholder=''
                values={pin}
                aria-label=''
                style={{ marginTop: 0 }}
                onComplete={(value, index) => Submit(value)}
                inputStyle={{
                  borderRadius: 15,
                  backgroundColor: "transparent",
                  margin: "initial",
                  color: "transparent",
                  
                  border: "#ddddddc5 0.5px solid",
                  width: 50,
                  height: 50,
                }}
                // onComplete={(value, index) => setPin(value)}
                autoSelect={true}
                autoFocus={true}
                regexCriteria={/^[ A-Za-z0-9_@./#&+-]*$/}

              // disabled={disablePin}
              />
              }
    </div>
  )
}

export default PinInputs