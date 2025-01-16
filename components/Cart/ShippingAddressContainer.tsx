import React, { useState } from "react";
import OrderCartIcon from "public/svg/cart/orderCartIcon.svg";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import FreeShippingIcon from "public/svg/product/FreeShipping.svg";
import AddAddressIcon from "public/svg/cart/AddAddress.svg";
function ShippingAddressContainer({ slideNext, slidePrev }) {
  const cart = useSelector((state: StateInterface) => state.cart?.cart);
  return (
    <div className="flex flex-col w-full p-3">
      <CartItemSelect items={cart} />
      <ShippingAddressInput slideNext={slideNext} slidePrev={slidePrev} />
    </div>
  );
}

export default ShippingAddressContainer;

const CartItemSelect = ({ items }) => {
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const [openCart, setOpenCart] = useState(false);
  return (
    <div
      style={{
        border: "1px solid rgb(196 194 194 / 51%)",
        borderRadius: "15px",
      }}
      className={`flex-col ${
        openCart && "pt-[15px]"
      } relative pl-[12px] justify-center w-full min-h-[50px] cursor-pointer`}
      onClick={() => setOpenCart(!openCart)}
    >
      <span className={` absolute top-[22px] right-[12px] `}>
        <svg
          className={`${openCart && "rotate-180"} transition`}
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 10 6"
        >
          <path
            id="Path_15448"
            data-name="Path 15448"
            d="M4.245,5.7a1.111,1.111,0,0,0,1.51,0L9.573,2.258A1.3,1.3,0,0,0,8.818,0H1.182A1.3,1.3,0,0,0,.427,2.258Z"
            fill="#8d8d8d"
          />
        </svg>
      </span>
      <div className="flex-row ">
        <OrderCartIcon />
        <div className="regular text-[#1D1D1D] text-[14px] ml-2">
          {translateFunction("Your Shopping Bag", language)}
          <span className="bold ml-1">
            {items.length}
            <span className="ml-1">{translateFunction("items", language)}</span>
          </span>
        </div>
      </div>
      <div
        className={`${
          !openCart ? "h-0 pb-[0px] pt-[0px]" : `pl-[11px] pb-[12px] pt-[11px] `
        } transition flex-row `}
      >
        {openCart &&
          items.map((s, i) => {
            return (
              <div className="flex h-[125px]" key={i}>
                <img
                  className="w-[91px] h-[125px] rounded-[15px]"
                  src={s.image}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

const ShippingAddressInput = ({ slideNext, slidePrev }) => {
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  return (
    <div
      style={{
        border: "1px solid rgb(196 194 194 / 51%)",
        borderRadius: "15px",
      }}
      className={`flex-col mt-[11px]  relative pr-[12px] pl-[12px] justify-start pt-[15px] w-full min-h-[203px] `}
    >
      <div className="flex-row ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="18"
          height="18"
          viewBox="0 0 18 18"
        >
          <defs>
            <clipPath id="clip-path22">
              <rect
                id="Rectangle_4612"
                data-name="Rectangle 4612"
                width="18"
                height="18"
                fill="none"
              />
            </clipPath>
          </defs>
          <g
            id="Mask_Group_380"
            data-name="Mask Group 380"
            clip-path="url(#clip-path22)"
          >
            <g id="delivery_location" transform="translate(1.163 -0.036)">
              <g id="Group_11335" data-name="Group 11335">
                <g
                  id="Group_11333"
                  data-name="Group 11333"
                  transform="translate(0 4.8)"
                >
                  <path
                    id="Path_21554"
                    data-name="Path 21554"
                    d="M13.317,15.143H7.281a.218.218,0,0,1-.218-.233.227.227,0,0,1,.218-.233h6.036a2.054,2.054,0,0,0,2.109-2.109,2.05,2.05,0,0,0-.524-1.295,2.085,2.085,0,0,0-1.585-.684h-3.8a2.473,2.473,0,1,1,0-4.945h3.1a.218.218,0,0,1,.218.233.207.207,0,0,1-.233.2H9.521a2.029,2.029,0,0,0,0,4.058h3.8a2.5,2.5,0,0,1,2.56,2.414,2.534,2.534,0,0,1-2.56,2.589Z"
                    transform="translate(-2.147 -5.645)"
                    fill="#1d1d1d"
                  />
                  <g
                    id="Group_11332"
                    data-name="Group 11332"
                    transform="translate(0 6.313)"
                  >
                    <ellipse
                      id="Ellipse_269"
                      data-name="Ellipse 269"
                      cx="0.975"
                      cy="0.989"
                      rx="0.975"
                      ry="0.989"
                      transform="translate(1.702 1.687)"
                      fill="#1d1d1d"
                    />
                    <path
                      id="Path_21555"
                      data-name="Path 21555"
                      d="M4.289,12.645a2.645,2.645,0,0,0-2.676,2.6,2.464,2.464,0,0,0,.509,1.513v.015l1.964,2.705a.227.227,0,0,0,.175.087.207.207,0,0,0,.175-.087l1.993-2.705a.014.014,0,0,1,.015-.015,2.526,2.526,0,0,0,.509-1.513A2.623,2.623,0,0,0,4.289,12.645Zm0,4.1a1.44,1.44,0,1,1,1.425-1.44A1.431,1.431,0,0,1,4.289,16.747Z"
                      transform="translate(-1.613 -12.645)"
                      fill="#1d1d1d"
                    />
                  </g>
                </g>
                <g
                  id="Group_11334"
                  data-name="Group 11334"
                  transform="translate(9.658)"
                >
                  <path
                    id="Path_21556"
                    data-name="Path 21556"
                    d="M12.323,3.3h6.051L15.348.323Z"
                    transform="translate(-12.323 -0.323)"
                    fill="#1d1d1d"
                  />
                  <path
                    id="Path_21557"
                    data-name="Path 21557"
                    d="M12.984,7.969h1.367v-1.8a.227.227,0,0,1,.218-.233h1.687a.218.218,0,0,1,.218.233v1.8h1.367V4.129H12.984Z"
                    transform="translate(-12.388 -0.696)"
                    fill="#1d1d1d"
                  />
                </g>
              </g>
            </g>
          </g>
        </svg>
        <div className="regular text-[#1D1D1D] text-[14px] ml-2">
          {translateFunction("Shipping & Delivery Address", language)}
        </div>
        <span className="bold ml-[11px]">
          <FreeShippingIcon />
        </span>
      </div>
      <div className="regular text-[12px] text-[#8D8D8D] ml-[28px]">
        {translateFunction(
          "Please Enter Shipping Address To Receive Your Bag",
          language
        )}
      </div>
      <AddressContainer />
      <AddAddressButton
        onClick={() => {
          slideNext();
        }}
      />
    </div>
  );
};
const AddressContainer = () => {
  return (
    <div className="flex-col py-[12px] items-center mt-[10px] rounded-[15px] bg-[#F8F8F8] w-full h-[84px]">
      <span className="">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 14 14"
        >
          <g
            id="Group_13008"
            data-name="Group 13008"
            transform="translate(-65 -464)"
          >
            <g
              id="Group_10756"
              data-name="Group 10756"
              transform="translate(65 464)"
            >
              <path
                id="Subtraction_1"
                data-name="Subtraction 1"
                d="M.305,11.241a.3.3,0,0,1-.182-.063.338.338,0,0,1-.111-.353L.787,8.273A5.591,5.591,0,0,1,0,5.408,5.313,5.313,0,0,1,5.2,0a5.313,5.313,0,0,1,5.2,5.408,5.314,5.314,0,0,1-5.2,5.41,5.064,5.064,0,0,1-2.917-.926L.478,11.187A.278.278,0,0,1,.305,11.241Zm4.847-3.1a.666.666,0,1,0,.656.666A.652.652,0,0,0,5.152,8.145Zm.134-5.308A1.026,1.026,0,0,1,6.4,3.864c0,.5-.213.816-.815,1.194a1.672,1.672,0,0,0-.953,1.5v.118c0,.373.2.6.521.6.3,0,.47-.189.5-.548.024-.519.211-.78.833-1.162A1.964,1.964,0,0,0,5.331,1.887a2.1,2.1,0,0,0-2.05,1.146,1.384,1.384,0,0,0-.135.6.45.45,0,0,0,.482.506c.261,0,.407-.126.5-.434A1.109,1.109,0,0,1,5.286,2.837Z"
                transform="translate(0 2.758)"
                fill="#c4c2c2"
              />
              <path
                id="Path_21380"
                data-name="Path 21380"
                d="M11.934,11.258a.3.3,0,0,1-.184.064.277.277,0,0,1-.171-.055L9.773,9.973l-.02.013a6.2,6.2,0,0,0,.469-2.376A5.937,5.937,0,0,0,4.41,1.564a5.512,5.512,0,0,0-1.277.148A5.047,5.047,0,0,1,6.857.079a5.314,5.314,0,0,1,5.2,5.409,5.574,5.574,0,0,1-.787,2.864l.775,2.554a.335.335,0,0,1-.11.352Z"
                transform="translate(0.79 0.557)"
                fill="#c4c2c2"
              />
              <rect
                id="Rectangle_4714"
                data-name="Rectangle 4714"
                width="13.459"
                height="14"
                transform="translate(0.541)"
                fill="none"
              />
            </g>
          </g>
        </svg>
      </span>
      <div className="flex medium text-[12px] text-[#C4C2C2] mt-[12px]">
        {translateFunction("Your Address List Is Empty")}
      </div>
      <div className="flex regular text-[12px] text-[#C4C2C2] mt-[3px]">
        {translateFunction("You Can Also Create Multiple Addresses To Use")}
      </div>
    </div>
  );
};
const AddAddressButton = ({ onClick }) => {
  return (
    <div
      className="flex cursor-pointer w-full justify-center h-[40px] mt-[8px] items-center bg-[#E8FFED]"
      style={{
        border: "1px solid rgb(196 194 194 / 51%)",
        borderRadius: "15px",
      }}
      onClick={() => {
        onClick();
      }}
    >
      <AddAddressIcon />
      <div className="medium text-[12px] ml-1 text-[#1D1D1D]">
        {translateFunction("Add Shipping Address")}
      </div>
    </div>
  );
};
