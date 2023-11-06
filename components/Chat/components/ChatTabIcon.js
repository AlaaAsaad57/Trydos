import React from 'react'
import BellIcon from "../svg/bell.svg"
function ChatTabIcon({index,SelectedTab,Icon,ActiveIcon,HasNewItemIcon,NumberOfItems}) {
    const getIcon=()=>{
        if(SelectedTab){
            return <ActiveIcon/>
        }
        else if(NumberOfItems>0){
            return <HasNewItemIcon/>
        }
        else{
            return <Icon/>
        }
    }
    const getStyle=()=>{
        if(index===1){
            return{marginLeft:"40px",justifyContent:"flex-start"}
        }
        if(index===2){
            return{justifyContent:"center"}
        }
        if(index===3){
            return{marginRight:"40px",justifyContent:"flex-end"}

        }
    }
  return (
    <div className='chat-tab-icon' style={getStyle()}>
        {getIcon()}
        {NumberOfItems>0&&
        <div className='number-of-new-item' style={{left:index===2?"72px":"28px"}}>
            <BellIcon></BellIcon>
            <span>{NumberOfItems}</span>
        </div>}
    </div>
  )
}

export default ChatTabIcon