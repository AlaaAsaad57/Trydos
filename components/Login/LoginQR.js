import React from 'react'
import Border from '../global/Border'
import ScanIcon from "public/svg/ScanIcon.svg"
import QuestionIcon from "public/svg/questionIcon.svg"
import { useSelector } from 'react-redux'
import { translate } from 'utils/functions'
import QRCode from "react-qr-code";
function LoginQR({selectedMethod,selectMethod}) {
    const language=useSelector((state)=>state.homepage.language)
  return (
    <div aria-details={language}className='login-label-container' onClick={()=>selectMethod()} style={{height:selectedMethod?'332px':"50px",marginTop:"10px",paddingTop:"15px",alignItems:"flex-start",cursor:"pointer"}}>
    <Border height={selectedMethod?332:50}/>
    <div aria-details={language}className='login-label login-extend' style={{height:selectedMethod?'332px':"50px",flexDirection:"column",alignItems:"flex-start",justifyContent:"flex-start"}}>
    <div aria-details={language}className='login-label-title'>
        <ScanIcon className={selectedMethod&&'active-login-icon'}/>
        <div aria-details={language}className='login-label-text' aria-labelledby={language+'-regular'}>
            {translate('By Scan Qr From Trydos App',language)}
        </div>
    </div>
    <div aria-details={language}className='login-qr-section'>
       {selectedMethod&&<>
            <div aria-details={language}className='login-qr-info'>
            <QuestionIcon style={{transform:"scale(0.6666666)"}}/>
            <div aria-details={language}className='login-qr-info-text' aria-labelledby={language+'-light'}>
                {translate('Scan This Qr Code From You Trydos App In Your Phone',language)}
            </div>
            </div>
            <div aria-details={language}className='qr-element'>
            <QRCode
            size={200}
            style={{ borderRadius:"20px"}}
            value={"Test"}
            level='H'
            viewBox={`0 0 200 200`}
            bo
            />
            </div>
        </>}
    </div>
    </div>
    
</div>
  )
}

export default LoginQR