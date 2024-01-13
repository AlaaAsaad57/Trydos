"use server"
import React from 'react'
import dynamic from 'next/dynamic'
const WebviewCall =dynamic(()=>import('components/global/WebviewCall', { ssr: false }))

function page() {
    
  return (
    <div>
        <WebviewCall/>
    </div>
  )
}

export default page