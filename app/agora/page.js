import React from 'react'
import App from '../../components/testCalls'
import { SSRDetect } from '../../utils/functions'

function AgoraTest() {
  return (
    <div>
     {SSRDetect()&&   <App/>}
    </div>
  )
}

export default AgoraTest