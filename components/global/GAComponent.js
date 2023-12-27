"use client"
import Script from 'next/script'
import React, { useEffect } from 'react'
import { SmartLookInit } from '../../utils/constants'

function GAComponent() {
    useEffect(()=>{
        SmartLookInit()
    },[])
    let GA_MEASUREMENT_ID='G-EK7TKN11PV'
  return (
    <>
       <Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `}
</Script>
    </>
  )
}

export default GAComponent