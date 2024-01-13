"use server"
import React from 'react'
import MissedIcon from "components/Chat/svg/missedCall.svg"
function page() {
    
  return (
    <div className='call-ended-screen' style={{width:'100vw',height:'100vh',display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",backgroundColor:'#000',color:'#FFF',flexDirection:'column'}}>
      <MissedIcon style={{marginBottom:'10px',transform:'scale(1.5)'}}></MissedIcon>
        Call Answered from another Account
    </div>
  )
}

export default page