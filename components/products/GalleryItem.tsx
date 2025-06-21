import React from "react";
import GalleryItemSlider from "./GalleryItemSlider";
import Heart from "public/svg/Heart.svg";
import { GalleryItemPropsType } from "models/componentType/GalleryItemPropsType";

function GalleryItem({
  image,
  text,
  date,
  likes,
  name,
  avatar,
  extended,
  onClick,
}: GalleryItemPropsType) {
  return (
    <div
      className={`${
        extended ? "w-full" : "mr-3"
      } transition-all gallery-slider-item mt-3 relative  min-h-[267px] h-auto rounded-[30px] overflow-hidden`}
      data-cy="GalleryChooseItem"
      onClick={() => {
        onClick();
      }}
    >
      {extended && <GalleryItemFloatingElements />}
      <GalleryItemSlider images={image} />
      <div
        className={`${
          extended ? "h-[98px] pl-[20px] pr-[30px] pb-[10px] pt-[10px]" : "h-0"
        } transition-all rounded-b-[30px] bg-[#F8F8F8]  gallery-item-desc flex-col relative`}
        data-cy="ProductsDetailInfo"
      >
        {extended && (
          <>
            <div className="flex-row  justify-start items-start relative">
              <div className="flex-row items-start" data-cy="ToClose">
                <div className="w-[20px] h-[20px] rounded-[50%] relative comment-photo">
                  <img
                    className="w-[20px] h-[20px] rounded-[50%]"
                    src={avatar}
                  />
                </div>
              </div>
              <div className="comment-content flex-col ml-[10px] ">
                <div className="comment-source flex text-[#969696] text-[14px] regualr  ">
                  {name}
                </div>
                <div className="comment-text regular text-[#5d5c5d] text-[14px] mt-[3px] h-10 overflow-hidden">
                  {text}
                </div>
              </div>
            </div>
            <div className="comment-date  absolute top-[14px] right-[10px] regular text-[10px] text-[#8d8d8d] flex">
              {date}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function GalleryItemFloatingElements() {
  return (
    <>
      <div
        className="gallery-item-options flex-col absolute right-[20px] bottom-[118px] h-[110px] w-[20px] justify-between z-[60]"
        data-cy="UserInteractions"
      >
        <div className="w-5 flex justify-center items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <defs></defs>
            <g
              id="Mask_Group_285"
              data-name="Mask Group 285"
              transform="translate(0 0.342)"
              clipPath="url(#clipPath)"
            >
              <g id="Love" transform="translate(0 0.841)">
                <path
                  id="Path_21279"
                  data-name="Path 21279"
                  d="M20.413,6.178a5.78,5.78,0,0,0-4.526-3.631A5.409,5.409,0,0,0,10.91,4.689,5.408,5.408,0,0,0,5.926,2.551,5.772,5.772,0,0,0,1.407,6.178a5.834,5.834,0,0,0,1.347,6.284l7.925,7.77a.33.33,0,0,0,.462,0l7.925-7.77a5.834,5.834,0,0,0,1.347-6.284ZM18.6,11.99,10.91,19.534,3.216,11.99A5.175,5.175,0,0,1,2.022,6.416a5.1,5.1,0,0,1,3.991-3.21,4.553,4.553,0,0,1,.607-.041,5.01,5.01,0,0,1,4.024,2.256.342.342,0,0,0,.531,0A4.886,4.886,0,0,1,15.8,3.2a5.112,5.112,0,0,1,4,3.215A5.175,5.175,0,0,1,18.6,11.99Z"
                  transform="translate(-1.007 -2.499)"
                  fill="#505050"
                />
              </g>
            </g>
          </svg>
        </div>
        <div className="w-5 flex justify-center items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <g
              id="Mask_Group_369"
              data-name="Mask Group 369"
              transform="translate(0 -0.238)"
            >
              <path
                id="send-2"
                d="M16.716,3.123,7.4,6.217c-6.26,2.094-6.26,5.508,0,7.591l2.764.918.918,2.764c2.083,6.261,5.507,6.261,7.591,0l3.1-9.3c1.382-4.177-.887-6.457-5.064-5.064Zm.33,5.549-3.919,3.94a.772.772,0,0,1-1.093,0,.778.778,0,0,1,0-1.093l3.919-3.94a.773.773,0,1,1,1.093,1.093Z"
                transform="translate(-2.708 -2.212)"
                fill="#505050"
              />
            </g>
          </svg>
        </div>
        <div className="w-5 flex justify-center items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="6"
            height="20"
            viewBox="0 0 6 20"
          >
            <g
              id="Group_11414"
              data-name="Group 11414"
              transform="translate(-395 -717)"
            >
              <g
                id="Group_11151"
                data-name="Group 11151"
                transform="translate(395 717)"
              >
                <g
                  id="Ellipse_221"
                  data-name="Ellipse 221"
                  fill="none"
                  stroke="#505050"
                  strokeWidth="0.5"
                >
                  <circle cx="3" cy="3" r="3" stroke="none" />
                  <circle cx="3" cy="3" r="2.75" fill="none" />
                </g>
                <g
                  id="Ellipse_222"
                  data-name="Ellipse 222"
                  transform="translate(0 7)"
                  fill="none"
                  stroke="#505050"
                  strokeWidth="0.5"
                >
                  <circle cx="3" cy="3" r="3" stroke="none" />
                  <circle cx="3" cy="3" r="2.75" fill="none" />
                </g>
                <g
                  id="Ellipse_223"
                  data-name="Ellipse 223"
                  transform="translate(0 14)"
                  fill="none"
                  stroke="#505050"
                  strokeWidth="0.5"
                >
                  <circle cx="3" cy="3" r="3" stroke="none" />
                  <circle cx="3" cy="3" r="2.75" fill="none" />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
      <div
        className="flex-row absolute z-[60] bottom-[17px] right-[10px] w-[55px] h-[16px] text-[12px] regular justify-between text-[#8D8D8D]"
        data-cy="CountOfUserInteractions"
      >
        <Heart className="scale-[0.6]  origin-top-right" />
        <span data-cy="CountOfLoved">110k</span>
      </div>
    </>
  );
}
export default GalleryItem;
