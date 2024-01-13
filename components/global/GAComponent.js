"use client"
import Script from 'next/script'
import React, { useEffect } from 'react'
import { SmartLookInit } from 'utils/constants'

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
   
  `}
</Script>

<Script>{(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K8QKJJLK')}</Script>

    </>
  )
}

export default GAComponent