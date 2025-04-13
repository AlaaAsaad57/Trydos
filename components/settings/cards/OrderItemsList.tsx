import React from "react";
import { OrdersIcon } from "../OrdersList";
import { translateFunction } from "utils/functions";

function OrderItemsList({
  items,
  isExpanded,
  setExpanded,
}: {
  items: any;
  isExpanded: boolean;
  setExpanded: (s: boolean) => void;
}) {
  return (
    <div className="w-full flex-col">
      <div
        onClick={() => {
          setExpanded(!isExpanded);
        }}
        className="bg-[#F4F4F4] mt-[8px] ml-[8px] w-full min-h-[74px] h-auto  rounded-[15px] py-[7px] px-[12px] flex-col"
        style={{
          border: isExpanded && "1px solid #C4C2C27f",
        }}
      >
        <OrdersIcon />
        <span className="text-[#8D8D8D] text-[10px] regular mt-[5px]">
          {translateFunction("Order Details")}
        </span>
        <span className="text-[#1D1D1D] text-[12px] regular ">
          <span className="bold"> {items.length}</span>{" "}
          {translateFunction("Items")}
        </span>
      </div>
      <div
        className={` ${
          isExpanded ? "h-0 pb-[0px] mt-[0px]" : "pb-[50px] mt-[12px] "
        } flex-row   items-center pl-[12px]  whitespace-nowrap overflow-x-scroll overflow-y-hidden [&::-webkit-scrollbar]:hidden`}
      >
        {items.map((product) => (
          <div
            key={product.product_details.id}
            className="flex-row cursor-pointer items-center relative w-[91px] h-[125px] ml-[5px]"
          >
            <img
              className="w-full h-full object-cover rounded-[15px]"
              src={product.product_details.thumbnail}
              alt={product.product_details.name}
              width={100}
              height={100}
              style={{
                border: "1px solid #FFFFFF7F",
              }}
            />
            <div className="flex-col text-[10px] regular text-[#1d1d1d] absolute bottom-[-50px] items-center left-0 right-0 mx-[0_auto]">
              <div className="flex flex-row">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                >
                  <defs>
                    <clipPath id="clip-path097">
                      <rect
                        id="Rectangle_6199"
                        data-name="Rectangle 6199"
                        width="13"
                        height="13"
                        transform="translate(0 -0.269)"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_715"
                    data-name="Mask Group 715"
                    transform="translate(0 0.269)"
                    clipPath="url(#clip-path097)"
                  >
                    <g
                      id="Group_4033"
                      data-name="Group 4033"
                      transform="translate(0.923 0)"
                    >
                      <g
                        id="Group_4032"
                        data-name="Group 4032"
                        transform="translate(0 0)"
                      >
                        <path
                          id="Path_15859"
                          data-name="Path 15859"
                          d="M-2.338-1.536H5.269L6.707,6.4s-.72,1.1-1.133,1.1a80.184,80.184,0,0,1-8.4-.139c-.688-.085-.928-.963-.928-.963Z"
                          transform="translate(3.992 5.055)"
                          fill="#ffdbaa"
                        />
                        <g id="bag-5">
                          <g id="Group_2946" data-name="Group 2946">
                            <path
                              id="Path_15168"
                              data-name="Path 15168"
                              d="M51.528,35.022h7.829a1.528,1.528,0,0,0,1.528-1.528.162.162,0,0,0,0-.029l-1.273-7.178a.843.843,0,0,0-.837-.714h-.915v-.867a2.417,2.417,0,1,0-4.834,0v.868h-.915a.843.843,0,0,0-.838.712L50,33.465a.165.165,0,0,0,0,.029A1.528,1.528,0,0,0,51.528,35.022Zm1.831-10.315a2.083,2.083,0,0,1,4.167,0v.868H53.359ZM51.6,26.347h0a.509.509,0,0,1,.509-.435h.916v1.319a.17.17,0,1,0,.333,0V25.909h4.167v1.318a.17.17,0,1,0,.334,0V25.909h.916a.509.509,0,0,1,.509.435h0l1.268,7.162a1.2,1.2,0,0,1-1.194,1.185h-7.83a1.2,1.2,0,0,1-1.2-1.181Z"
                              transform="translate(-49.999 -22.291)"
                              fill="#3c3c3c"
                            />
                          </g>
                        </g>
                      </g>
                      <path
                        id="Path_15172"
                        data-name="Path 15172"
                        d="M0,0A4.994,4.994,0,0,0,2.765,1.139,5.991,5.991,0,0,0,5.726,0"
                        transform="translate(2.581 8.318)"
                        fill="none"
                        stroke="#1d1d1d"
                        strokeLinecap="round"
                        strokeWidth="0.5"
                      />
                    </g>
                  </g>
                </svg>
                <svg
                  className="ml-[4px]"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                >
                  <defs>
                    <clipPath id="clip-path075">
                      <rect
                        id="Rectangle_6200"
                        data-name="Rectangle 6200"
                        width="13"
                        height="13"
                        fill="none"
                      />
                    </clipPath>
                  </defs>
                  <g
                    id="Mask_Group_716"
                    data-name="Mask Group 716"
                    clipPath="url(#clip-path075)"
                  >
                    <g id="work" transform="translate(0 0.252)">
                      <path
                        id="Path_23009"
                        data-name="Path 23009"
                        d="M4.739,10.128v4.337H6.761v-2.6h3.625v2.6h.264v-2.6h3.1V10.128Z"
                        transform="translate(-1.401 -2.574)"
                      />
                      <path
                        id="Path_23010"
                        data-name="Path 23010"
                        d="M12.173,8.75h2.468v.742H12.173Z"
                        transform="translate(-3.598 -2.167)"
                      />
                      <path
                        id="Path_23011"
                        data-name="Path 23011"
                        d="M12.416,7.484h2.468v.742H12.416Z"
                        transform="translate(-3.67 -1.793)"
                      />
                      <path
                        id="Path_23012"
                        data-name="Path 23012"
                        d="M6.376,4.454l.256.167.249-.1A.425.425,0,0,1,7.035,4.5a.426.426,0,0,1,.375.63l.117.076H8.833l.017-.025L6.78,3.832Z"
                        transform="translate(-1.885 -0.713)"
                      />
                      <path
                        id="Path_23013"
                        data-name="Path 23013"
                        d="M11.122,12.868H9.878v1.293l-.141-.1-.128.1-.119-.1-.136.1-.133-.1-.092.1V12.868H7.886v2.691h3.236Z"
                        transform="translate(-2.331 -3.384)"
                      />
                      <path
                        id="Path_23014"
                        data-name="Path 23014"
                        d="M13.406,15.559h3.236V12.868H15.4v1.293l-.141-.1-.128.1-.119-.1-.136.1-.133-.1-.092.1V12.868H13.406Z"
                        transform="translate(-3.962 -3.384)"
                      />
                      <path
                        id="Path_23015"
                        data-name="Path 23015"
                        d="M1.759,12.058a.485.485,0,0,0,.442.525l.042,0a.485.485,0,0,0,.483-.444L2.97,9.3h0a.482.482,0,0,0,0-.058s0-.007,0-.011,0-.031,0-.046,0,0,0-.007L2.612,7.1a5.416,5.416,0,0,1,.114-1.836L1.887,4.37A.427.427,0,0,1,2.2,3.65a.429.429,0,0,1,.311.134l.791.84.151.121a.315.315,0,0,0,.362.023l.8-.493h0l.526-.809.547.356,0-.007a.315.315,0,0,0-.135-.425l-.222-.115a.315.315,0,0,0-.31.011l-1.352.83L2.606,3.262a.314.314,0,0,0-.091-.05.785.785,0,0,0-1.155.564c-.19.64.454.952-.31,2.62a1.079,1.079,0,0,0-.1.371.482.482,0,0,0,.031.3L1.993,9.344Z"
                        transform="translate(-0.277 -0.501)"
                      />
                      <path
                        id="Path_23016"
                        data-name="Path 23016"
                        d="M1.473,1.2a1.16,1.16,0,0,1,.035-.17C1.136,1.066.7,1.26.628,2.085s-.357.909-.575.875.271.442.838-.034c.437-.366.263-1.292.573-1.521A1.156,1.156,0,0,1,1.473,1.2Z"
                        transform="translate(0 0.116)"
                      />
                      <circle
                        id="Ellipse_539"
                        data-name="Ellipse 539"
                        cx="1.043"
                        cy="1.043"
                        r="1.043"
                        transform="translate(1.155 1.27) rotate(-37.523)"
                      />
                      <path
                        id="Path_23017"
                        data-name="Path 23017"
                        d="M6.923,5.983l-.864.334-.352,1.7.188.039L6.132,6.91V8.674H9.368V6.91l.237,1.141.188-.039L9.372,5.983H6.923Z"
                        transform="translate(-1.687 -1.349)"
                      />
                      <path
                        id="Path_23018"
                        data-name="Path 23018"
                        d="M5.938,5.277a.315.315,0,1,0-.227-.588l-1.733.669L2.825,4.134a.315.315,0,1,0-.459.432l1.3,1.378a.315.315,0,0,0,.343.078Z"
                        transform="translate(-0.674 -0.773)"
                      />
                    </g>
                  </g>
                </svg>
              </div>
              <span className="mt-[2px]">{product?.variation?.color}</span>
              <span>{product?.variation?.Size}</span>
            </div>
            <div
              className="absolute z-10 top-0 left-0 w-full h-full "
              style={{
                boxShadow: "inset 0px 3px 6px rgba(255, 255, 255, 0.5)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderItemsList;
