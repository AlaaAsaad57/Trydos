import React, { useEffect, useState } from 'react'
import PhoneIcon from "public/svg/PhoneIcon.svg"
import SolidPhoneIcon from "public/svg/SolidPhoneIcon.svg"
import QuestionIcon from "public/svg/questionIcon.svg"
import { useDispatch, useSelector } from 'react-redux'
import { translate } from 'utils/functions'
import Border from '../global/Border'
import LeftArrowIcon from "public/svg/LeftArrowIcon.svg"
import CheckedIcon from "public/svg/CheckedIcon.svg"
import PenIcon from "public/svg/PenIcon.svg"
import WAIcon from "public/svg/WAIcon.svg"
import { textMarshal } from 'text-marshal'
import { allCountries } from 'country-telephone-data'
import replaceString from 'replace-string';
import MessageIcon from "public/svg/MessageIcon.svg"
import Timer from './Timer'
import PinInputs from './PinInput'
import { CheckPhone, Login, ReInitialise, SendOtp, VerifyOtp } from 'store/auth/actions'
const {flag} = require('country-emoji');
function LoginPhone({selectedMethod,selectMethod,LoginSuccess}) {
  const dispatch=useDispatch()
  const [rerender,setRender]=useState(true)
    const [inputValue,setInputValue]=useState('')
    const [disabled,setDisabled]=useState(false)

    const [validNumber,setValidNumber]=useState(false)
    const [MessageMethod,setMessageMethod]=useState(null)
    const getCountry=()=>{
      return  allCountries.filter((countryItem)=>inputValue.startsWith(countryItem.dialCode)).length===1?allCountries.filter((countryItem)=>inputValue.startsWith(countryItem.dialCode))[0]:allCountries.filter((countryItem)=>inputValue.startsWith(countryItem.dialCode))[0]
    }
    const handleInput=(e)=>{
        let pattern=null
        let country=getCountry()
        setStepHeight(152)
        if(country){
        
          pattern=  replaceString((country.format||''), '.', 'x');
          pattern=replaceString(pattern,'-','  ')
          pattern=replaceString(pattern,'+','')
        }
        pattern=pattern || 'xxx xxx xxx xxx xxxxx'
        let data = textMarshal({
            input: e.target.value,
            template:pattern,
            disallowCharacters: [/[a-z]/],
          });
          setInputValue(data.plaintext)
          if(data.plaintext.length===pattern?.split('').filter((letter)=>letter==='x').length){
            setValidNumber(true);
            
          }
          else{
            setValidNumber(false);
          }

          e.target.value = data.marshaltext;
    }
    const [stepHeight,setStepHeight]=useState(50)
    const language=useSelector((state)=>state.homepage.language)
    const attempts=useSelector((state)=>state.auth.attempts)
    const verficationID=useSelector((state)=>state.auth.verficationID)
    const wrongNumber=useSelector((state)=>state.auth.wrongNumber)
    useEffect(()=>{
        if(selectedMethod)
        setStepHeight(152)
    else
    setStepHeight(50)
    },[selectedMethod])
    useEffect(()=>{
      if(attempts===0){
        setDisabled(true)
      }
    },[attempts])
    useEffect(()=>{
      if(wrongNumber.length>0){
        setStepHeight(282)
      }
    },[wrongNumber])
  return (
    <div aria-details={language}className='login-label-container' onClick={()=>selectMethod()} style={{height:`${stepHeight}px`,marginTop:"10px",paddingTop:"15px",alignItems:"flex-start",cursor:"pointer"}}>
    <Border height={stepHeight}/>
    <div aria-details={language}className='login-label login-extend' style={{height:`${stepHeight}px`,flexDirection:"column",alignItems:"flex-start",justifyContent:"flex-start"}}>
    <div aria-details={language}className='login-label-title'>
        <PhoneIcon className={selectedMethod&&'active-login-icon'}/>
        <div aria-details={language}className='login-label-text' aria-labelledby={language+'-regular'}>
            {translate('By Mobile Phone Number',language)}
        </div>
    </div>
 <div aria-details={language}className='login-qr-section'>
       {selectedMethod&&<>
            <div aria-details={language}className='login-qr-info'>
            <QuestionIcon style={{transform:"scale(0.6666666)"}}/>
            <div aria-details={language}className='login-qr-info-text' aria-labelledby={language+'-light'}>
                {translate('Enter Your Phone Number Registered With Us',language)}
            </div>
            </div>
            <div aria-details={language}className='login-phone-element' style={{backgroundColor:wrongNumber.length>0?'#FFF5F5':stepHeight>152&&'#F5F5F5'}}>
          {stepHeight===152&& <Border height={50} width={350} color={validNumber&&'#4D84FF'}/>}
            <div aria-details={language}className='phone-input-element'>
            <SolidPhoneIcon/>
           <span className='flag-icon'>
            {getCountry()&&getCountry()?.iso2&&flag(getCountry()?.iso2)}
           </span>
           <span className='plus-icon-phone' ar>+</span>
           <input disabled={stepHeight>152} onChange={(e)=>handleInput(e)} className='login-phone-input'/>
           {validNumber&&stepHeight===152&&<LeftArrowIcon onClick={()=>{CheckPhone(inputValue,(e)=>setStepHeight(e));}} className='phone-arrow'/>}
           {stepHeight>152&& <PenIcon className='phone-arrow' onClick={()=>{setStepHeight(152);
           dispatch(ReInitialise());
            setTimeout(() => {
              document.querySelector('.login-phone-input').focus()
            }, 400);
          }}/>}
            </div>
            </div>
        </>}
    </div>  
    {selectMethod&&stepHeight===282&&wrongNumber.length>0&&
    <div aria-details={language}className='login-qr-section'>
      <div aria-details={language}className='signup-text' aria-labelledby={language+'-regular'}>
        {translate(wrongNumber,language)}
      </div>
      <div aria-details={language}className='login-blue-text' aria-labelledby={language+'-light'}>
        {translate('Register With Us In A Few Simple Steps',language)}
      </div>
    </div>
    } 
    {stepHeight===277&&
      <>
        <div aria-details={language}className='login-label-title' style={{marginTop:"28px"}}>
          <CheckedIcon style={{marginTop:"2px"}}/>
          <div aria-details={language}className='login-label-text' aria-labelledby={language+'-regular'} style={{fontSize:"12px"}}>
              {translate('Choose The Verification Method',language)}
          </div>
        </div>
        <div aria-details={language}className='login-qr-section'>
       {selectedMethod&&<>
            <div aria-details={language}className='login-qr-info'>
            <QuestionIcon style={{transform:"scale(0.6666666)"}}/>
            <div aria-details={language}className='login-qr-info-text' aria-labelledby={language+'-light'}>
                {translate('Send Verification Code To',language)}
            </div>
            </div>
            <div aria-details={language}className='login-qr-section message-recieve-options'>
              <div aria-details={language}className='message-recieve-option' onClick={()=>{setMessageMethod('WA'); setStepHeight(287); SendOtp(inputValue,1,(e)=>{setStepHeight(e)})}}>
                <div aria-details={language}className='border-option'>
                <svg xmlns="http://www.w3.org/2000/svg" width="170" height="50" viewBox="0 0 170 50">
                <g id="Rectangle_4729" data-name="Rectangle 4729" fill="none" stroke="#4d84ff" strokeLinecap="round" stroke-linejoin="round" strokeWidth="0.5" strokeDasharray="3 3">
                  <rect width="170" height="50" rx="15" stroke="none"/>
                  <rect x="0.25" y="0.25" width="169.5" height="49.5" rx="14.75" fill="none"/>
                </g>
              </svg>
                </div>
                <WAIcon style={{left:"34px",top:"17px"}}/>
                <div aria-details={language}className='message-recieve-option-text' aria-labelledby={language+'-regular'}>
                  {translate('WhatsApp',language)}
                </div>
              </div>
              <div aria-details={language}className='message-recieve-option' onClick={()=>{setMessageMethod('SMS'); setStepHeight(287); SendOtp(inputValue,0,(e)=>{setStepHeight(e)})}}>
              <div aria-details={language}className='border-option'>
                <svg xmlns="http://www.w3.org/2000/svg" width="170" height="50" viewBox="0 0 170 50">
                <g id="Rectangle_4729" data-name="Rectangle 4729" fill="none" stroke="#4d84ff" strokeLinecap="round" stroke-linejoin="round" strokeWidth="0.5" strokeDasharray="3 3">
                  <rect width="170" height="50" rx="15" stroke="none"/>
                  <rect x="0.25" y="0.25" width="169.5" height="49.5" rx="14.75" fill="none"/>
                </g>
              </svg>
                </div>
                <MessageIcon style={{left:"48px",top:"17px"}}/>
                <div aria-details={language}className='message-recieve-option-text' aria-labelledby={language+'-regular'}>
                  {translate('SMS',language)}
                </div>
              </div>
           </div>
        </>
  
        }
    </div> 
      </>
      
    }
    {stepHeight>=287&&<>

            <div aria-details={language}className='login-label-title' style={{marginTop:"28px"}}>
           {MessageMethod==='SMS'? <MessageIcon style={{marginTop:"2px"}}/>:<WAIcon style={{marginTop:"2px"}}/>}
            <div aria-details={language}className='login-label-text' aria-labelledby={language+'-regular'} style={{fontSize:"12px"}}>
                {translate('Please Enter The Verification Code Sent To Your Phone',language)}
            </div>
        </div>
        <div aria-details={language}className='login-qr-section'>
       {selectedMethod&&<>
            <div aria-details={language}className='login-qr-info'>
            <QuestionIcon style={{transform:"scale(0.6666666)"}}/>
            <div aria-details={language}className='login-qr-info-text duartion-login-label' aria-labelledby={language+'-light'}>
                {translate('You Can Resend The Code After',language)}
                 <span className='blue-text' aria-labelledby={language+'-semibold'}>
                  <Timer onResume={()=>setDisabled(false)} onFinish={()=>{setDisabled(true);}}/>
                 </span>
            </div>
            </div>
          
        </>
  
        }
    </div> 
    <div aria-details={language}className='login-qr-section'>
            <PinInputs onFailedLogin={()=>setStepHeight(416)} rerender={rerender} setRender={(e)=>setRender(e)} LoginSuccess={()=>{LoginSuccess()}} Login={(value)=>VerifyOtp(value,verficationID)} disabled={disabled}/>
      </div> 
        </>
           }
     {stepHeight===416&& 
          <div aria-details={language}className='login-qr-section' style={{marginTop:"18px",alignItems:"center"}}>
            <div aria-details={language}className='login-light-label' aria-labelledby={language+'-light'}>
              {translate('Please Enter The Correct Code Sent To Your Phone',language)}
            </div>
            <div aria-details={language}className='login-attempt' aria-labelledby={language+'-medium'}>
              {translate('You Have',language)} {attempts} {translate('Attempts',language)}
            </div>
            <div aria-details={language}className='login-change-method'>
              <div aria-details={language}className='method-change-label' aria-labelledby={language+'-light'}>
                {translate('Didn`t You Receive A Code?',language)}
              </div>
              <div aria-details={language}className='method-change-anchor' aria-labelledby={language+'-regular'} onClick={()=>{setStepHeight(277); }}>
              {translate('Change The Method Of Receiving',language)}
              </div>
            </div>
           </div> }
    </div>
    
</div>
  )
}

export default LoginPhone