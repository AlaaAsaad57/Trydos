import React from 'react'
import ReplyIcon from "../svg/rep.svg"
import CopyIcon from "../svg/copy.svg"
import CategoryIcon from "../svg/categ.svg"
import DeleteIcon from "../svg/delt.svg"
import EditIcon from "../svg/edit.svg"
import ForwardIcon from "../svg/forward.svg"
import RemindIcon from "../svg/remind.svg"
import { translate } from 'utils/functions'
import { useSelector } from 'react-redux'
function OptionsMenu(props) {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <div className="abs-menu">
        <div className='reply-but' onClick={()=>props.click()}>
            <ReplyIcon></ReplyIcon>
            <div className='rep-descs' style={{    bottom: "-34px"}}>{translate("Reply",language)}</div>
        </div>
        <div className='message-ops'>
            <div className='message-opt' onClick={()=>props.forward()}>
                <ForwardIcon></ForwardIcon>
            <div className='rep-descs'>{translate("Forward",language)}</div>
            </div>
            <div className='message-opt' onClick={()=>props.copy()}>
                <CopyIcon></CopyIcon>
            <div className='rep-descs' >{translate("Copy",language)}</div>
            </div>
            <div className='message-opt'>
                <CategoryIcon></CategoryIcon>
            <div className='rep-descs' >{translate("CategoryMessage",language)}</div>
            </div>
            <div className='message-opt'>
                <DeleteIcon></DeleteIcon>
            <div className='rep-descs' >{translate("Delete",language)}</div>
            </div>
            <div className='message-opt'>
                <EditIcon></EditIcon>
            <div className='rep-descs' >{translate("Edit",language)}</div>
            </div>
            <div className='message-opt'>
                <RemindIcon></RemindIcon>
            <div className='rep-descs' >{translate("Reminder",language)}</div>
            </div>
        </div>
    </div>
  )
}

export default OptionsMenu