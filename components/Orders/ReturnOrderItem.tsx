import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import ReturnOrderItemIcon from "public/svg/ReturnOrderItemIcon.svg";
import { useAppStore } from "store";
import UploadImageOrder from "public/svg/UploadImageOrder.svg";
import Spinner from "components/global/Spinner";
import { GetImageUrl, pollinateInput } from "utils/tinyUtils";
import { ReturnOrderItemPropsType } from "models/componentType/ReturnOrderItemPropsType";
import order from "services/order";
import Skeleton from "node_modules/react-loading-skeleton/dist";

function ReturnOrderItem({
  backToMain,
  item,
  setShouldConfirmReturn,
}: ReturnOrderItemPropsType) {
  const { currency } = useAppStore();
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(null);

  const handleOptionClick = (option) => {
    if (selectedOptions?.id === option.id) {
      setSelectedOptions(null);
    } else {
      setSelectedOptions(option);
    }
  };
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const getReasons = async () => {
    try {
      setLoading(true);
      let response = await order.getReturnReasons();
      setOptions(response.data.return_reasons);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    getReasons();
  }, []);
  const [loadingImage, setLoadinImage] = useState(false);
  const [returnedQty, setReturnedQty] = useState(item.qty);
  return (
    <>
      <div className="flex-col w-full items-center pb-[12px] px-[24px]">
        <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
        <div className="w-[104px] h-[144px] mt-[20px] relative">
          <span
            className="absolute top-0 left-0 z-10 w-full h-[144px] rounded-[15px]"
            style={{
              boxShadow: "inset 0px 3px 6px #ffffff80",
            }}
          ></span>
          <Image
            className="rounded-[15px] h-[144px] object-cover"
            style={{
              border: "1px solid #ffffff80",
            }}
            src={getConfiguredImage({
              src: item.image,
              width: 104,
              height: 144,
              q: 100,
            })}
            width={104}
            height={144}
            alt={item.name}
          />
        </div>
        <div className="">
          <ReturnOrderItemIcon className="mt-[12px] [&>path]:fill-[#402CDD]" />
        </div>
        <span className="medium text-[14px] mt-[11px] text-[#402CDD]">
          {translateFunction("Return This Product")}
        </span>
        <p className="text-[#8D8D8D] text-[12px] regular text-center">
          {translateFunction(
            "You Can Return The Product Without Any Conditions According To The Return Policy And Get A Full Refund"
          )}
          <span className="bold text-[12px] text-[#8D8D8D] ml-[4px]">
            {RoundPrice({
              num: item?.price_after_discount || item.offer_price,
              rate: currency.exchange_rate,
            })}
          </span>
          <span className="text-[#8D8D8D] mx-[4px]">{currency?.symbol}</span>
          {translateFunction("To Your Account")}.
        </p>
        <span className="border-[#C4C2C280] border-b-[1px] w-full mt-[12px]" />
      </div>

      <div className="flex-row w-full items-center justify-center mt-[30px]">
        <p className="text-[#8D8D8D] text-[12px] regular text-center">
          {translateFunction("Why Was The Product Return?")}
          <span className="text-[#402CDD] mx-[4px] cursor-pointer">
            {translateFunction("Learn More Tips.")}
          </span>
        </p>
      </div>
      <div className="flex-row w-full flex-1 basis-0 text-center rounded-[20px] items-center justify-center h-[50px] text-[14px] medium text-[#1D1D1D]">
        {translateFunction("Change Qty")}
      </div>
      <div className="flex-row items-center justify-center mt-[20px] w-full max-w-[200px]">
        <button
          onClick={() => setReturnedQty(Math.max(0, item.qty - 1))}
          className="flex items-center justify-center w-[40px] h-[40px] rounded-l-[12px] bg-[#F8F8F8] border border-[#E6E6E680] border-r-0 hover:bg-[#EEEEEE] transition-colors duration-200 active:scale-95"
        >
          <span className="text-[#1D1D1D] text-[18px] light">−</span>
        </button>
        <input
          type="number"
          value={returnedQty}
          onChange={(e) => {
            if (parseInt(pollinateInput(e.target.value)) > item.qty) {
              setReturnedQty(returnedQty);
            } else {
              setReturnedQty(
                Math.max(0, parseInt(pollinateInput(e.target.value)))
              );
            }
          }}
          className="flex-1 h-[40px] text-center text-[16px] font-medium text-[#1D1D1D] bg-white border-t border-b border-[#E6E6E680] focus:outline-none focus:border-[#402CDD] focus:ring-1 focus:ring-[#402CDD80] transition-all duration-200"
          min="1"
        />
      </div>
      <div className="flex-row w-full flex-wrap items-center mt-[12px] gap-y-[10px]  gap-x-[12px] pr-[50px]  pl-[24px]">
        {loading ? (
          <OptionsSkeleton />
        ) : (
          options.map((option, index) => (
            <div
              key={option?.id}
              className={`px-[12px] w-auto regular text-[12px] text-[#5D5C5D] flex-row h-[39px] justify-start items-center rounded-[12px] bg-[#F8F8F8] `}
              style={{
                flex: "0 1 auto",
                border:
                  selectedOptions?.id === option.id
                    ? "1px solid #402CDD80"
                    : "none",
              }}
              onClick={() => {
                handleOptionClick(option);
              }}
            >
              <span className="regular text-[12px] text-[#8D8D8D]">
                {option.reason_ae_en}
              </span>
            </div>
          ))
        )}
      </div>
      {selectedOptions && (
        <>
          <span className="border-[#C4C2C280] border-b-[1px] w-full mt-[12px]" />
          <UploadImageComponent
            loading={loadingImage}
            setLoading={setLoadinImage}
            images={images}
            setImages={setImages}
          />
        </>
      )}
      <div className="flex-row px-[24px] w-full mt-[15px]">
        <div
          className={`w-full h-[53px] items-center justify-center  flex cursor-pointer ${
            !selectedOptions ? "bg-[#D3D3D3] " : "bg-[#402CDD] "
          } rounded-[20px] text-[16px] text-[#fff] medium`}
          onClick={() => {
            if (loadingImage) return;
            if (!selectedOptions) {
              backToMain();
            } else {
              setShouldConfirmReturn({
                item: { ...item, qty: returnedQty },
                images: images,
                reasons: selectedOptions,
                qty: returnedQty,
              });
              //   setConfirmationData({
              //     enable: true,
              //     currentAddress: addressLists?.find((s) => s.id === address_id),
              //     newAddress: addressLists?.find(
              //       (s) => s.id === selectedAddressId
              //     ),
              //   });
            }
          }}
        >
          {loadingImage ? (
            <Spinner />
          ) : (
            <>
              {!selectedOptions
                ? translateFunction("Close")
                : translateFunction("Return Request")}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ReturnOrderItem;
export const UploadImageComponent = ({
  images,
  setImages,
  loading,
  setLoading,
}) => {
  const UploadImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files[0];
      if (file) {
        setLoading(true);
        // const formData = new FormData();
        // formData.append("image", file);
        // const response = await fetch("/api/upload", {
        //   method: "POST",
        //   body: formData,
        // });
        // const data = await response.json();
        let data = await order.UploadImageForOrderReturn({ image: file });

        setImages([
          ...images,
          process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
            `/return_request_products/` +
            data.sub_path,
        ]);
        setLoading(false);
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }
    };
    input.click();
  };

  return (
    <div
      className="flex-col w-full items-center mt-[12px] px-[24px] cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".order-return-item-image")) {
          return;
        }
        UploadImage();
      }}
    >
      <div
        style={{
          border: images.length === 0 ? "1px solid #402CDD80" : "none",
        }}
        className={`${
          images.length === 0 ? "justify-center" : "justify-between pr-[12px]"
        } flex-row w-full items-center justify-center bg-[#F8F8F8] rounded-[12px] h-[80px]`}
      >
        {images.length > 0 && (
          <div className="flex-row gap-[3px]">
            {images.map((s, i) => (
              <div
                key={i}
                className="flex-row items-center justify-center relative cursor-pointer order-return-item-image"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setImages(images.filter((im) => im !== s));
                }}
              >
                <Image
                  className="rounded-[12px] object-cover h-[80px] w-[57px]"
                  src={GetImageUrl(s)}
                  alt="image"
                  width={57}
                  height={80}
                />
                <span
                  style={{
                    boxShadow: "inset 0px 3px 6px #ffffff80",
                    border: "1px solid #ffffff80",
                  }}
                  className="absolute w-[57px] h-[80px] rounded-[12px] "
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex-col items-center justify-center">
          {loading ? <Spinner /> : <UploadImageOrder />}
          {images.length === 0 && (
            <span className="text-[#402CDD] text-[10px] regular">
              {translateFunction("Add Photo")}
            </span>
          )}
        </div>
      </div>
      {images.length === 0 && (
        <div className="flex-row w-full  text-center items-center justify-center mt-[12px] text-[#402CDD] text-[10px] regular">
          {translateFunction(
            "Please Add Photos Of The Product You Received So That We Can Provide You With The Best Service To Avoid This Issue."
          )}
        </div>
      )}
    </div>
  );
};
const OptionsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 7 }).map((s, i) => (
        <div
          className={`px-[12px] w-[70px] max-w-[70px] regular text-[12px] text-[#5D5C5D] flex-row h-[39px] justify-start items-center rounded-[12px]  `}
        >
          <Skeleton
            key={i}
            width={70}
            height={40}
            borderRadius={12}
            style={{
              flex: "0 1 auto",
            }}
          ></Skeleton>
        </div>
      ))}
    </>
  );
};
