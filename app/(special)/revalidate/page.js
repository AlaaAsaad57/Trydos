"use client"
import Revalidate from "../../revalidate"
import React, { useEffect } from 'react'

function page() {
    useEffect(()=>{
        revalidate()
    },[])
    const revalidate=async()=>{
        await   Revalidate()
    }
  return (
    <div>page</div>
  )
}

export default page 