import React from 'react'
import ReactRecord from "react-record";
import { SSRDetect } from 'utils/functions';
function Recorder({isRecording,onStop,setblobUrl,blobs}) {
  return (
 
       <>
      {SSRDetect()&& <ReactRecord
          record={isRecording}
          onStop={onStop}
          onData={(blo) => {
            setblobUrl(blo);
            blobs.current = blo;
          }}
        ></ReactRecord>}
       </> 
      
  )
}

export default Recorder