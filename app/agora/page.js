import React from 'react'
import dynamic from 'next/dynamic'
const App = dynamic(() => import('../../components/testCalls'), { ssr: false });
function AgoraTest() {
  return (
    <div>
     {   <App/>}
    </div>
  )
}

export default AgoraTest