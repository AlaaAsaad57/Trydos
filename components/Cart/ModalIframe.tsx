import { useEffect, useRef } from "react";
import { AxiosGet } from "utils/AxiosApi";

import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";

const LoadingColorSvg = ({ w = "14", h = "14", loading = false }) => {
  return (
    <svg
      id="Component_100_1"
      data-name="Component 100 – 1"
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={h}
      viewBox="0 0 14 14"
      className={loading ? "animate-spin text-blue-500" : ""}
    >
      <path
        id="Path_21968"
        data-name="Path 21968"
        d="M225.105,96.481a5.683,5.683,0,0,1-6.858-5.555.86.86,0,0,0-1.721,0,7.4,7.4,0,0,0,8.935,7.238.86.86,0,0,0-.356-1.683Z"
        transform="translate(-216.526 -83.593)"
        fill="#007cff"
        fillRule="evenodd"
      />
      <path
        id="Path_21969"
        data-name="Path 21969"
        d="M222.307,87.4a5.678,5.678,0,0,1,2.218,10.431.86.86,0,0,0,.917,1.456,7.4,7.4,0,0,0-2.895-13.59.86.86,0,0,0-.241,1.7Z"
        transform="translate(-214.108 -85.691)"
        fill="#00c408"
        fillRule="evenodd"
      />
      <path
        id="Path_21970"
        data-name="Path 21970"
        d="M218.5,90.809a5.7,5.7,0,0,1,3.391-3.241.86.86,0,0,0-.57-1.624,7.428,7.428,0,0,0-4.417,4.222.86.86,0,1,0,1.6.643Z"
        transform="translate(-216.374 -85.593)"
        fill="#404040"
        fillRule="evenodd"
      />
    </svg>
  );
};

interface ModalIframeProps {
  _closeIframe: () => void;
  handleIframeLoad?: () => void;
  isLoading?: boolean;
  openIframe?: any;
}

const ModalIframe = ({
  openIframe,
  isLoading,
  handleIframeLoad,
  _closeIframe,
}: ModalIframeProps) => {
  const { setOrderData, cart } = useAppStore();
  const iframeRef = useRef(null);
  useEffect(() => {
    const handleMessage = async (event: any) => {
      if (event.data === "close-iframe") {
        if (iframeRef.current) {
          _closeIframe();
          let response = await fetchData({
            url: `/customer/order/getOrdersByCartGroupID?cart_group_id=${cart[0].cart_group_id}`,
            method: "GET",
            server: "market",
            reqTitle: "getOrdersByCartGroupID",
          });
          if (response.data && response.data?.length > 0) {
            setOrderData({ data: response.data, success: true });
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
  return (
    <div className="relative w-[100%] h-[100%] justify-center content-center ">
      <div className="relative flex w-[100%] h-[100%]  flex-grow flex-col items-center justify-start">
        <div className="absolute top-0 right-0 p-2 z-[9999]">
          <button
            onClick={async () => {
              if (iframeRef.current) {
                _closeIframe();
                let response = await fetchData({
                  url: `/customer/order/getOrdersByCartGroupID?cart_group_id=${cart[0].cart_group_id}`,
                  method: "GET",
                  server: "market",
                  reqTitle: "getOrdersByCartGroupID",
                });
                if (response.data && response.data?.length > 0) {
                  setOrderData({ data: response.data, success: true });
                }
              }
            }}
            className="text-red-500 text-xl cursor-pointer px-3"
          >
            X
          </button>
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center w-full h-full overflow-hidden justify-center bg-white bg-opacity-75 z-[999]">
            <LoadingColorSvg loading={isLoading} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          className="w-full transform origin-top h-full overflow-hidden"
          src={`${openIframe.url}`}
        ></iframe>
      </div>
    </div>
  );
};
export default ModalIframe;
