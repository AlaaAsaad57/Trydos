'use client'
import React, { useEffect } from 'react'
function CallComponentWidget({data,type,onAnswer,onDecline}) {
   
    useEffect(()=>{
        // var sound = new Howl({
        //     src: ['/default.mp3'],
        //     autoplay: true,
        //     loop: true,
        //     volume: 0.1,
        //     html5:true,
        //     onend: function() {
        //       if(process.env.NEXT_PUBLIC_ENABLE_LOG==='true') console.log('Finished!');
        //     },
        //     onplayerror: function() {
                
        //         sound.once('unlock', function() {
        //           sound.play();
        //         });
        //       }
        //   });
        //   sound.play()
         
    },[])
  return (
    <div
    className='video-call'
  >
<div className='hgg' style={{
          backgroundImage: `url(${'/images/profileNo.png'})`,
          left:0,
          right:0,
          margin:'0 auto'
          }}>
  
          </div>
          <span className='caller-name'>
          Caller
        </span>
        <div className={`toggle-mic call-rec ${data.loading&&'disabled-label'}`} onClick={()=>onAnswer()}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                        <path fill="#f7f7f7" id="Union_14" data-name="Union 14" d="M13.458,19.856a22.692,22.692,0,0,1-7.607-5.212A22.621,22.621,0,0,1,.639,7.036c-.852-2.261-.852-4.111,0-4.959.122-.122.245-.253.376-.389C1.786.874,2.678-.051,3.821,0A3.363,3.363,0,0,1,6.188,1.517c2.342,2.911,1.284,3.951.065,5.154l-.218.214c-.2.2-.581,1.126,2.936,4.639a19.652,19.652,0,0,0,2.907,2.5c.5.319,1.371.8,1.736.442l.217-.221c1.2-1.221,2.239-2.273,5.154.069A3.384,3.384,0,0,1,20.5,16.678c.045,1.162-.876,2.038-1.694,2.813-.131.126-.263.249-.385.372a2.7,2.7,0,0,1-1.945.634A8.875,8.875,0,0,1,13.458,19.856Z" />
                    </svg>
        </div>
          <div className={`toggle-vid call-dec ${data.loading&&'disabled-label'}`} onClick={()=>onDecline()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 28 26">
            <path fill="#f7f7f7" id="Union_14" data-name="Union 14" d="M13.458,19.856a22.692,22.692,0,0,1-7.607-5.212A22.621,22.621,0,0,1,.639,7.036c-.852-2.261-.852-4.111,0-4.959.122-.122.245-.253.376-.389C1.786.874,2.678-.051,3.821,0A3.363,3.363,0,0,1,6.188,1.517c2.342,2.911,1.284,3.951.065,5.154l-.218.214c-.2.2-.581,1.126,2.936,4.639a19.652,19.652,0,0,0,2.907,2.5c.5.319,1.371.8,1.736.442l.217-.221c1.2-1.221,2.239-2.273,5.154.069A3.384,3.384,0,0,1,20.5,16.678c.045,1.162-.876,2.038-1.694,2.813-.131.126-.263.249-.385.372a2.7,2.7,0,0,1-1.945.634A8.875,8.875,0,0,1,13.458,19.856Z" transform="matrix(-0.719, 0.695, -0.695, -0.719, 28.986, 14.745)" />
        </svg>
          </div>
  </div>
  )
}

export default CallComponentWidget