import React, { useEffect, useState } from 'react'
import PhoneIcon from "@/assets/svg/PhoneIcon.svg"
import SolidPhoneIcon from "@/assets/svg/SolidPhoneIcon.svg"
import QuestionIcon from "@/assets/svg/questionIcon.svg"
import { useSelector } from 'react-redux'
import { translate } from '@/utils/functions'
import Border from '../global/Border'
import LeftArrowIcon from "@/assets/svg/LeftArrowIcon.svg"
import { textMarshal } from 'text-marshal'
import { allCountries } from 'country-telephone-data'
import replaceString from 'replace-string';
const {flag, code, name, countries} = require('country-emoji');
function LoginPhone({selectedMethod,selectMethod}) {
    const [inputValue,setInputValue]=useState('')
    const [validNumber,setValidNumber]=useState(false)
    const getCountry=()=>{
      return  allCountries.filter((countryItem)=>inputValue.startsWith(countryItem.dialCode)).length===1?allCountries.filter((countryItem)=>inputValue.startsWith(countryItem.dialCode))[0]:allCountries.filter((countryItem)=>inputValue.startsWith(countryItem.dialCode))[0]
    }
    const handleInput=(e)=>{
        let pattern=null
        let country=getCountry()
        if(country){
          pattern=  replaceString(country.format, '.', 'x');
          pattern=replaceString(pattern,'-','  ')
          pattern=replaceString(pattern,'+','')
        }
        let data = textMarshal({
            input: e.target.value,
            template:pattern||'xxxxxxxxxxxxxxxxx',
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
    useEffect(()=>{
        if(selectedMethod)
        setStepHeight(152)
    else
    setStepHeight(50)
    },[selectedMethod])
  return (
    <div className='login-label-container' onClick={()=>selectMethod()} style={{height:`${stepHeight}px`,marginTop:"10px",paddingTop:"15px",alignItems:"flex-start",cursor:"pointer"}}>
    <Border height={stepHeight}/>
    <div className='login-label' style={{height:`${stepHeight}px`,flexDirection:"column",alignItems:"flex-start",justifyContent:"flex-start"}}>
    <div className='login-label-title'>
        <PhoneIcon className={selectedMethod&&'active-login-icon'}/>
        <div className='login-label-text' aria-labelledby={language+'-regular'}>
            {translate('By Mobile Phone Number',language)}
        </div>
    </div>
    <div className='login-qr-section'>
       {selectedMethod&&<>
            <div className='login-qr-info'>
            <QuestionIcon style={{transform:"scale(0.6666666)"}}/>
            <div className='login-qr-info-text' aria-labelledby={language+'-light'}>
                {translate('Enter Your Phone Number Registered With Us',language)}
            </div>
            </div>
            <div className='login-phone-element'>
           <Border height={50} width={350} color={validNumber&&'#4D84FF'}/>
            <div className='phone-input-element'>
            <SolidPhoneIcon/>
           <span className='flag-icon'>
            {getCountry()&&getCountry()?.iso2&&flag(getCountry()?.iso2)}
           </span>
           <span className='plus-icon-phone' ar>+</span>
           <input onChange={(e)=>handleInput(e)} className='login-phone-input'/>
           {validNumber&&<LeftArrowIcon className='phone-arrow'/>}
            </div>
            </div>
        </>}
    </div>
    </div>
    
</div>
  )
}

export default LoginPhone