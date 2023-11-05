import React, { useEffect } from 'react'
import ReplyIcon from "../svg/rep.svg"
import CopyIcon from "../svg/copy.svg"
import CategoryIcon from "../svg/categ.svg"
import DeleteIcon from "../svg/delt.svg"
import EditIcon from "../svg/edit.svg"
import ForwardIcon from "../svg/forward.svg"
import RemindIcon from "../svg/remind.svg"
function OptionsMenu(props) {
  return (
    <div className="abs-menu">
        <div className='reply-but' onClick={()=>props.click()}>
            <ReplyIcon></ReplyIcon>
            <div className='rep-descs' style={{    bottom: "-34px"}}>Reply</div>
        </div>
        <div className='message-ops'>
            <div className='message-opt' onClick={()=>props.forward()}>
                <ForwardIcon></ForwardIcon>
            <div className='rep-descs'>Forward</div>
            </div>
            <div className='message-opt' onClick={()=>props.copy()}>
                <CopyIcon></CopyIcon>
            <div className='rep-descs' >Copy</div>
            </div>
            <div className='message-opt'>
                <CategoryIcon></CategoryIcon>
            <div className='rep-descs' >Category</div>
            </div>
            <div className='message-opt'>
                <DeleteIcon></DeleteIcon>
            <div className='rep-descs' >Delete</div>
            </div>
            <div className='message-opt'>
                <EditIcon></EditIcon>
            <div className='rep-descs' >Edit</div>
            </div>
            <div className='message-opt'>
                <RemindIcon></RemindIcon>
            <div className='rep-descs' >Re-Remind</div>
            </div>
        </div>
    </div>
  )
}

export default OptionsMenu