import { useDispatch, useSelector } from "react-redux";
import React from "react";
import { translateFunction } from "utils/functions";
import AddAddressIcon from "public/svg/cart/AddAddress.svg";

function AddressListContainer({ closeSelect, slideNext, Delete }) {
  const addressLists = useSelector(
    (state: StateInterface) => state.cart.addressLists
  );
  const dispatch = useDispatch();
  const GetAddressString = (location) => {
    let str = "";
    if (location.province) str += `${location.province}`;
    if (location.city) str += ` | ${location.city}`;
    if (location.town) str += ` | ${location.town}`;
    if (location.street) str += ` | ${location.street}`;
    if (location.building) str += ` | ${location.building}`;
    return str;
  };
  return (
    <>
      <div
        className="absolute top-[50px] left-0 min-w-[100vw] z-[999999998] min-h-screen opacity-40 bg-[black]"
        onClick={() => {
          closeSelect();
        }}
      />
      <div
        style={{
          bottom: "0px",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 40px)",
        }}
        className="flex-col items-center px-[12px]  select-animation-in fixed z-[999999999] rounded-t-[30px] bg-[#fff] h-[481px] w-full pt-[11px]"
      >
        <div className="flex-row items-center w-full justify-center">
          <MiniDeliveryIcon />
          <span className="flex regular ml-[6px] text-[#1D1D1D] text-[14px]">
            {translateFunction("Your Address List")}
          </span>
        </div>
        <div className="flex-col justify-between pb-[25px] h-full w-full max-w-[650px]">
          <div className="flex-col  mt-[20px] h-auto max-h-[290px] overflow-auto">
            {addressLists.map((s, i) => (
              <div
                key={i}
                onClick={() => {
                  dispatch({ type: "UPDATE-ADDRESS", payload: s });
                  closeSelect(false);
                }}
                style={{
                  border:
                    addressLists[0].id !== s.id ? "" : "#388bff8c 1px solid",
                }}
                className={`flex-col relative  ${
                  addressLists.length === 0
                    ? "items-center h-[84px]   py-[12px]"
                    : "items-start h-[auto] min-h-[90px] px-[24px]  py-[7px]"
                } mt-[10px] rounded-[15px] bg-[#F8F8F8] w-full `}
              >
                <EditIcon
                  onClick={() => {
                    closeSelect();
                    slideNext();
                  }}
                  address={s}
                />
                <DeleteIcon
                  address={s}
                  onClick={() => {
                    Delete(s);
                  }}
                />
                <div className="flex-col">
                  <div className="flex-row items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                    >
                      <path
                        id="home-3"
                        d="M11.677,5.219h0L6.781.324a1.1,1.1,0,0,0-1.563,0L.325,5.216l0,.005A1.1,1.1,0,0,0,1.056,7.1l.034,0h.2v3.6A1.294,1.294,0,0,0,2.578,12H4.493a.352.352,0,0,0,.352-.352V8.824a.591.591,0,0,1,.59-.59h1.13a.591.591,0,0,1,.59.59v2.824A.352.352,0,0,0,7.506,12H9.421a1.294,1.294,0,0,0,1.293-1.293V7.1H10.9a1.1,1.1,0,0,0,.782-1.885Zm0,0"
                        transform="translate(0.001)"
                        fill="#8d8d8d"
                      />
                    </svg>

                    <span className="regular ml-[4px] text-[12px] text-[#8D8D8D]">
                      {s.address}
                    </span>
                  </div>
                  <div className="flex-row mt-[5px]  items-center regular text-[12px] text-[#8D8D8D]">
                    {GetAddressString(s.region_details)}
                  </div>
                  <div className="flex-row mt-[5px] items-center regular text-[12px] text-[#8D8D8D]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                    >
                      <defs>
                        <clipPath id="clip-path1213">
                          <rect
                            id="Rectangle_6097"
                            data-name="Rectangle 6097"
                            width="12"
                            height="12"
                            transform="translate(-0.245)"
                            fill="#8d8d8d"
                          />
                        </clipPath>
                      </defs>
                      <g
                        id="Mask_Group_646"
                        data-name="Mask Group 646"
                        transform="translate(0.245)"
                        clipPath="url(#clip-path1213)"
                      >
                        <g id="XMLID_7_" transform="translate(0.202 0.583)">
                          <path
                            id="XMLID_10_"
                            d="M10.461,8.411c-.055-.042-.111-.085-.164-.128-.281-.226-.579-.434-.868-.635l-.18-.125a1.791,1.791,0,0,0-1.016-.386,1.317,1.317,0,0,0-1.1.695.583.583,0,0,1-.5.3.993.993,0,0,1-.4-.1A4.848,4.848,0,0,1,3.7,5.568c-.236-.529-.159-.876.255-1.157A1.171,1.171,0,0,0,4.6,3.383,5.865,5.865,0,0,0,2.534.569a1.172,1.172,0,0,0-.8,0A2.306,2.306,0,0,0,.3,1.747,2.194,2.194,0,0,0,.334,3.518,14.288,14.288,0,0,0,3.469,8.291a15.2,15.2,0,0,0,4.756,3.158,2.634,2.634,0,0,0,.47.14c.044.01.081.018.109.026a.183.183,0,0,0,.046.006h.015a2.7,2.7,0,0,0,2.241-1.705C11.388,9.12,10.874,8.727,10.461,8.411Z"
                            transform="translate(-0.131 -0.498)"
                            fill="#8d8d8d"
                          />
                        </g>
                      </g>
                    </svg>

                    <div className="flex-row ml-[4px]   items-center regular text-[12px] text-[#8D8D8D]">
                      {s.contact_info.phone}
                    </div>
                    <div className="flex-row ml-[17px]  items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                      >
                        <defs>
                          <clipPath id="clip-path232323">
                            <rect
                              id="Rectangle_6098"
                              data-name="Rectangle 6098"
                              width="12"
                              height="12"
                              fill="none"
                            />
                          </clipPath>
                        </defs>
                        <g
                          id="Mask_Group_647"
                          data-name="Mask Group 647"
                          clipPath="url(#clip-path232323)"
                        >
                          <g
                            id="Group_13"
                            data-name="Group 13"
                            transform="translate(1.162 0)"
                          >
                            <path
                              id="Path_20"
                              data-name="Path 20"
                              d="M651.622,148c.318-.068.611-.331.658-.913.04-.476-.083-.722-.264-.846.5-2.042-.88-2.441-.88-2.441a2.072,2.072,0,0,0-3.047-.522,3.6,3.6,0,0,0-.891.765,3.182,3.182,0,0,0-.681,2.132c-.246.092-.44.331-.391.918.05.609.367.868.7.918a2.435,2.435,0,0,0,4.794-.008Zm-2.4,1.5c-1.218,0-2.2-1.653-2.2-3.025,0-.184.005-.362.017-.523a4.18,4.18,0,0,0,3.411-1.257,4,4,0,0,1,.971,1.736v.044c.008,1.371-.973,3.026-2.192,3.026Z"
                              transform="translate(-644.484 -142.822)"
                              fill="#8d8d8d"
                            />
                            <path
                              id="Path_21"
                              data-name="Path 21"
                              d="M643.18,174.122l.141-.584a.341.341,0,0,1,.1-.169l-.042-.032-1.261-1.044-.768.184a2.785,2.785,0,0,0-2.214,2.662v1.653a.613.613,0,0,0,.635.585h3.247l.495-2.822a.344.344,0,0,1-.333-.432Z"
                              transform="translate(-639.136 -165.377)"
                              fill="#8d8d8d"
                            />
                            <path
                              id="Path_22"
                              data-name="Path 22"
                              d="M662.939,172.471l-.756-.184-1.259,1.044-.042.032a.341.341,0,0,1,.1.169l.141.584a.344.344,0,0,1-.333.425l.495,2.822h3.246a.59.59,0,0,0,.61-.585v-1.653a2.772,2.772,0,0,0-2.2-2.655Z"
                              transform="translate(-655.714 -165.376)"
                              fill="#8d8d8d"
                            />
                          </g>
                        </g>
                      </svg>

                      <div className="flex-row  ml-[4px]  items-center regular text-[12px] text-[#8D8D8D]">
                        {s.contact_info.contact_person_name ||
                          // @ts-ignore
                          s.contact_info?.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            className="flex cursor-pointer w-full justify-center h-[40px] mt-[8px] items-center bg-[#E8FFED]"
            style={{
              border: "1px solid rgb(196 194 194 / 51%)",
              borderRadius: "15px",
            }}
            onClick={() => {
              dispatch({ type: "INIT-ADDRESS-FORM", payload: true });
              closeSelect();
              slideNext();
            }}
          >
            <AddAddressIcon />
            <div className="medium text-[12px] ml-1 text-[#1D1D1D]">
              {translateFunction("Add Shipping Address")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddressListContainer;
const EditIcon = ({ address, onClick }) => {
  const dispatch = useDispatch();
  return (
    <span
      onClick={() => {
        dispatch({ type: "START-UPDATE-ADDRESS", payload: address });
        onClick();
      }}
      className="p-1 cursor-pointer flex justify-center absolute z-[10] right-[32px] top-[8px]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="clip-path884477">
            <rect
              id="Rectangle_4561"
              data-name="Rectangle 4561"
              width="12"
              height="12"
              transform="translate(-0.131)"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Group_13364"
          data-name="Group 13364"
          transform="translate(-363 -240)"
        >
          <g
            id="Mask_Group_64"
            data-name="Mask Group 64"
            transform="translate(363.131 240)"
            clipPath="url(#clip-path884477)"
          >
            <g
              id="Group_4665"
              data-name="Group 4665"
              transform="translate(0 0.449)"
            >
              <g id="drawing" transform="translate(0.831)">
                <path
                  id="Path_16019"
                  data-name="Path 16019"
                  d="M12.884,2.113,10.857.086a.291.291,0,0,0-.411,0L5.4,5.128a.291.291,0,0,0-.079.149l-.5,2.531a.291.291,0,0,0,.342.342l2.53-.5a.291.291,0,0,0,.149-.08l5.042-5.042a.291.291,0,0,0,0-.411ZM5.593,6.9,5.856,5.58,7.39,7.114l-1.323.262Z"
                  transform="translate(-2.742 0)"
                  fill="#8e8e8e"
                />
                <path
                  id="Path_16020"
                  data-name="Path 16020"
                  d="M8.341,16.772c-2.78-1.164-4.59.761-5.127,1.053-.69.373-1.664.813-1.89.053-.137-.459.6-.949,1.09-1.1.356-.111.2-.673-.155-.561-.762.241-1.667.877-1.507,1.779.118.669.956,1.282,2.572.427C4.5,17.806,5.3,16.529,7.767,17.191a2.451,2.451,0,0,1,1.751,1.553c.123.351.684.2.561-.155a3,3,0,0,0-1.738-1.817Z"
                  transform="translate(-0.733 -7.972)"
                  fill="#8e8e8e"
                />
              </g>
              <rect
                id="Rectangle_4536"
                data-name="Rectangle 4536"
                width="11.869"
                height="10.88"
                transform="translate(0 0.091)"
                fill="none"
              />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
};
const DeleteIcon = ({ address, onClick }) => {
  const dispatch = useDispatch();
  return (
    <span
      onClick={() => {
        onClick();
      }}
      className="p-1 cursor-pointer flex justify-center absolute z-[10] right-[8px] top-[8px]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="clip-path883763">
            <rect
              id="Rectangle_4561"
              data-name="Rectangle 4561"
              width="12"
              height="12"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Group_13363"
          data-name="Group 13363"
          transform="translate(-386 -240)"
        >
          <g
            id="Mask_Group_510"
            data-name="Mask Group 510"
            transform="translate(386 240)"
            clipPath="url(#clip-path883763)"
          >
            <g id="trash-can" transform="translate(1.348 -0.001)">
              <path
                id="Path_22129"
                data-name="Path 22129"
                d="M8.839,13.723H6.231a2.347,2.347,0,0,1-2.337-2.1L3.117,4.363a.276.276,0,0,1,.275-.306h8.286a.276.276,0,0,1,.275.306l-.777,7.261A2.346,2.346,0,0,1,8.839,13.723ZM3.7,4.61l.744,6.955A1.8,1.8,0,0,0,6.232,13.17H8.839a1.8,1.8,0,0,0,1.788-1.606L11.37,4.61Z"
                transform="translate(-2.883 -1.723)"
                fill="#f85555"
              />
              <path
                id="Path_22130"
                data-name="Path 22130"
                d="M11.852,3.072H3.1a.276.276,0,1,1,0-.553h8.75a.276.276,0,0,1,0,.553Z"
                transform="translate(-2.825 -1.416)"
                fill="#f85555"
              />
              <path
                id="Path_22131"
                data-name="Path 22131"
                d="M8.571,11.221a.277.277,0,0,1-.276-.276V7.63a.276.276,0,0,1,.553,0v3.314A.276.276,0,0,1,8.571,11.221Z"
                transform="translate(-3.919 -2.383)"
                fill="#f85555"
              />
              <path
                id="Path_22132"
                data-name="Path 22132"
                d="M10.642,11.221a.277.277,0,0,1-.276-.276V7.63a.276.276,0,0,1,.553,0v3.314A.276.276,0,0,1,10.642,11.221Z"
                transform="translate(-4.333 -2.383)"
                fill="#f85555"
              />
              <path
                id="Path_22133"
                data-name="Path 22133"
                d="M9.4,2.8H7.192a.277.277,0,0,1-.276-.276,1.38,1.38,0,0,1,2.759-.044.286.286,0,0,1,0,.044A.276.276,0,0,1,9.4,2.8ZM7.516,2.243H9.074a.827.827,0,0,0-1.558,0Z"
                transform="translate(-3.643 -1.14)"
                fill="#f85555"
              />
              <path
                id="Path_22134"
                data-name="Path 22134"
                d="M6.5,11.221a.277.277,0,0,1-.276-.276V7.63a.276.276,0,0,1,.553,0v3.314A.276.276,0,0,1,6.5,11.221Z"
                transform="translate(-3.505 -2.383)"
                fill="#f85555"
              />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
};

const MiniDeliveryIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="18"
      height="18"
      viewBox="0 0 18 18"
    >
      <defs>
        <clipPath id="clip-path9273">
          <rect
            id="Rectangle_4612"
            data-name="Rectangle 4612"
            width="18"
            height="18"
            transform="translate(0)"
            fill="none"
          />
        </clipPath>
      </defs>
      <g
        id="Group_13042"
        data-name="Group 13042"
        transform="translate(0 -0.389)"
      >
        <g
          id="Mask_Group_380"
          data-name="Mask Group 380"
          transform="translate(0 0.389)"
          clipPath="url(#clip-path9273)"
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
                  d="M13.317,15.143H7.281a.218.218,0,0,1-.218-.233.227.227,0,0,1,.218-.233h6.036a2.054,2.054,0,0,0,2.109-2.109,2.05,2.05,0,0,0-.524-1.295,2.085,2.085,0,0,0-1.585-.684h-3.8a2.473,2.473,0,1,1,0-4.945h3.1a.218.218,0,0,1,.218.233.207.207,0,0,1-.233.2H9.521a2.029,2.029,0,0,0,0,4.058h3.8a2.5,2.5,0,0,1,2.56,2.415,2.534,2.534,0,0,1-2.56,2.589Z"
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
      </g>
    </svg>
  );
};
