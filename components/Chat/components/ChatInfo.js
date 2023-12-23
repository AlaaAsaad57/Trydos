import React, { useEffect, useRef } from 'react'
import ArrowIcon from "../svg/arrow.svg"
import InfoCallIcon from "../svg/InfoCall.svg"
import InfoVideoIcon from "../svg/InfoVideo.svg"
import InfoSearchIcon from "../svg/InfoSearch.svg"
import InfoGalleryIcon from "../svg/InfoGallery.svg"
import ImageInfoIcon from "../svg/imageInfo.svg"
import VideoInfoIcon from "../svg/VideoInfo.svg"
import FileInfoIcon from "../svg/FileInfo.svg"
import InfoArrowIcon from "../svg/arrowRight.svg"
import SaveToGalleryIcon from "../svg/SaveToGallery.svg"
import DeleteInfoIcon from "../svg/deleteInfo.svg"
import BlockInfoIcon from "../svg/BlockInfo.svg"


import { getTwoLetters, getUser } from '../chatsFunctions'
function ChatInfo({activeChat,cancel}) {
    const ref=useRef()
    useEffect(() => {
      ref.current.style.display='flex'
      setTimeout(() => {
        ref.current.style.right='0px'
      }, 300);
      
      return () => {
      }
    }, [])
  return (
    <div ref={ref} className='chat-user-info-container'>
        <div onClick={()=>{
          ref.current.style.right='-430px'
          setTimeout(() => {
            cancel()
          }, 300);
          }} className='arrow-icon'><ArrowIcon></ArrowIcon></div>
        <div className='chat-info-user-avatar'>
         { activeChat.channel_members.filter((user)=>user.user_id!==getUser()?.id)[0]?.user?.photo_path?  <img src={process.env.REACT_APP_BASE_FILE_URL+activeChat.channel_members.filter((user)=>user.user_id!==getUser()?.id)[0]?.user?.photo_path}/>:<div className='text-avatar'>{getTwoLetters(activeChat?.channel_members.filter((user)=>user.user_id!==getUser()?.id)[0]?.user.name||activeChat.channel_members.filter((user)=>user.user_id!==getUser()?.id)[0]?.user.username)}</div> }
        </div>
        <div className='chat-user-info'> 
            <div className='chat-info-user-name'>{activeChat.channel_members.filter((user)=>user.user_id!==getUser()?.id)[0]?.user?.name||activeChat.channel_members.filter((user)=>user.user_id!==getUser()?.id)[0]?.user?.username}</div>
            <div className='chaat-info-user-phone'>{activeChat.channel_members.filter((user)=>user.user_id!==getUser()?.id)[0]?.user?.mobile_phone}</div>
        </div>
        <div className='chat-user-info-options'>
            <div className='chat-user-info-option'>
                <InfoCallIcon></InfoCallIcon> <span>Call</span>
            </div>
            <div className='chat-user-info-option' style={{marginLeft:"106px"}}>
                <InfoVideoIcon></InfoVideoIcon> <span>Video</span>
            </div>
            <div className='chat-user-info-option' style={{marginLeft:"98px"}}>
                <InfoSearchIcon></InfoSearchIcon> <span>Search</span>
            </div>
        </div>
        <div className='chat-user-files-container'>
        <div className='chat-user-files-icon'><InfoGalleryIcon></InfoGalleryIcon></div>
        <div className='chat-user-files-info'>
          <div className='.chat-user-files-info-text'>Media & Files</div>
          <div className='chat-user-files-info-content'>
            <div className='chat-user-files-info-content-item'>
              <ImageInfoIcon></ImageInfoIcon> 322
            </div>
            <div className='chat-user-files-info-content-item'>
              <VideoInfoIcon></VideoInfoIcon> 322
            </div>
            <div className='chat-user-files-info-content-item'>
              <FileInfoIcon></FileInfoIcon> 322
            </div>
          </div>
          <div className='chat-user-info-arrow'>
            <InfoArrowIcon></InfoArrowIcon>
          </div>
        </div>
        </div>
        <div className='chat-user-gallery-container'>
        <div className='chat-user-info-arrow gallery-option'>
         <span> Never</span>  <InfoArrowIcon></InfoArrowIcon>
          </div>
        <div className='chat-user-files-icon'><InfoGalleryIcon></InfoGalleryIcon></div>
        <div className='chat-user-files-info' style={{height:"auto"}}>
          <div className='.chat-user-files-info-text'>Save To Gallery</div>
          </div>
        </div>
        <div className='chat-user-options'>
          <div className='chat-user-option delete-option'>
            <DeleteInfoIcon/> <span>Delete Chat</span>
          </div>
          <div className='chat-user-option'>
            <BlockInfoIcon/><span>Block</span>
          </div>
        </div>
    </div>
  )
}

export default ChatInfo