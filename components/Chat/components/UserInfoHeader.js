import React from 'react'
import ProfilePicture from "../../../public/images/profileNo.png"
import { getTwoLetters, getUser } from '../chatsFunctions'
import { getUserChat } from '../../../utils/functions'
import Image from 'next/image'
function UserInfoHeader() {
    
  return (
    <div className='chat-window-header-user'>
        <div className={`avatar-holder ${(getUserChat().photo_path.includes('eu')||!getUserChat().photo_path) && 'text-avatar'}`}>
            <div className='inset-shadow'/>
            {getUserChat().photo_path?.includes('eu')?
            getUserChat().name?
            getTwoLetters(getUserChat().name):
            <Image src={40} width={40} height={ProfilePicture.src}/>
            :
            getUserChat().photo_path? <Image src={40} width={40} height={getUserChat().photo_path}/>:

getTwoLetters(getUserChat().name)
            }
        </div>
            <span>{localStorage.getItem("USER-CHAT")&&getUserChat().name||localStorage.getItem("USER-CHAT")&&getUserChat().name||'User'}</span>
    </div>
  )
}

export default UserInfoHeader