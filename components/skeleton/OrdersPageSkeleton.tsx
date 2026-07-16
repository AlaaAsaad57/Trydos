import Skeleton from "react-loading-skeleton";
import { translateFunction } from "utils/functions";

function OrdersPageSkeleton() {
  return (
    <div className="pb-2.5 flex-col relative top-0 left-0 min-h-screen max-h-screen h-auto overflow-hidden w-full bg-[#ffffff] min-w-screen z-9999999999 pt-1">
      <div className="flex-col pl-2 pr-2 bg-white p-1">
        <div className="flex-row w-full min-h-12.5 pl-1 pr-2 relative justify-between items-center">
          <img src="/icons/backIcon.svg" className="z-50" />
          <span className="text-[13px] text-[#505050] regular flex-row items-center">
            <img src="/icons/AddAddress.svg" />
            <span className="regular ml-2">
              {translateFunction("Bag Shipping & Delivery Address")}
            </span>
          </span>
          <span className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="flex-col overflow-auto pb-73 max-h-full px-2 pt-2">
        <div className="rounded-2xl border border-[#f1f1f1] bg-[#fdfdfd] p-4 mb-3">
          <div className="flex-row justify-between items-center mb-3">
            <Skeleton width={130} height={30} borderRadius={8} />
            <Skeleton width={72} height={30} borderRadius={8} />
          </div>
          <Skeleton width="85%" height={30} borderRadius={8} className="mb-2" />
          <Skeleton width="60%" height={30} borderRadius={8} />
        </div>

        <div className="rounded-2xl border border-[#f1f1f1] bg-[#fdfdfd] p-4 mb-3">
          <div className="flex-row justify-between items-center mb-3">
            <Skeleton width={140} height={30} borderRadius={8} />
            <Skeleton width={62} height={30} borderRadius={8} />
          </div>
          <div className="flex-row items-center justify-between rounded-xl bg-[#fafafa] p-3 mb-2">
            <div className="flex-row items-center gap-2">
              <Skeleton circle width={30} height={30} />
              <Skeleton width={120} height={30} borderRadius={8} />
            </div>
            <Skeleton width={45} height={30} borderRadius={8} />
          </div>
          <div className="flex-row items-center justify-between rounded-xl bg-[#fafafa] p-3">
            <div className="flex-row items-center gap-2">
              <Skeleton circle width={14} height={14} />
              <Skeleton width={95} height={12} borderRadius={8} />
            </div>
            <Skeleton width={52} height={12} borderRadius={8} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#f1f1f1] bg-[#fdfdfd] p-4">
          <Skeleton width={150} height={14} borderRadius={8} className="mb-3" />
          <div className="grid gap-2">
            <Skeleton height={42} borderRadius={10} />
            <Skeleton height={42} borderRadius={10} />
          </div>
        </div>
      </div>

      <div className="absolute flex-col items-center payment-order-bottom left-0 w-full">
        <div
          style={{ boxShadow: "0px -3px 20px #0000001a" }}
          className="text-center left-0 w-full h-25 bg-white px-5 pt-3"
        >
          <div className="w-full text-center justify-center flex-col items-center h-17.5 bg-[#C4C2C2] text-[#FEFEFE] text-[18px] medium rounded-[20px] flex">
            <Skeleton
              width={210}
              height={14}
              borderRadius={8}
              baseColor="#d3d3d3"
              highlightColor="#e0e0e0"
            />
            <div className="mt-2">
              <Skeleton
                width={170}
                height={12}
                borderRadius={8}
                baseColor="#d3d3d3"
                highlightColor="#e0e0e0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersPageSkeleton;
