import HortiznalScrollBar from 'components/global/HortiznalScrollBar';
import Spinner from 'components/global/Spinner';
import React, { useState } from 'react'

function ProductBuyersCommentList({children,offset,loadMoreString}) {
   const [commentsNodes,setCommentsNodes]=useState(children);
   const [offsetValue,setOffsetValue]=useState(offset);
   const [hasEnd,setHasEnd]=useState(commentsNodes?.length<5);
   const [loading,setLoading]=useState(false);
   const GetNextComments=async()=>{
    let response=await 
   }
  return (
   <>
   <HortiznalScrollBar
          id="comments-buyers-bar"
          className="flex-row w-full gap-[4px]"
        >
            {children}
          {!hasEnd&&offset&& (
            <div
              className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[100px] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
              style={{
                position: "relative",
              }}
              onClick={() => {
                if (!loading) GetNextComments();
              }}
            >
              <div className="w-full flex-col h-full justify-center items-center text-[#1d1d1d] light">
                {loading ? <Spinner /> : loadMoreString}
              </div>
            </div>
          )}
        </HortiznalScrollBar>
   {children}
   
   </>
  )
}

export default ProductBuyersCommentList