import React from "react";

function AddToCartButton() {
  return (
    <div className="add-cart-button">
      <img src={"/svg/plusCart.svg"} />
      <div className="button-desc">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="30"
          height="30"
          viewBox="0 0 30 30"
        >
          <defs>
            <clipPath id="clip-path">
              <rect
                id="Rectangle_4741"
                data-name="Rectangle 4741"
                width="30"
                height="30"
                transform="translate(-0.568 0.194)"
                fill="none"
              />
            </clipPath>
          </defs>
          <g
            id="Group_335"
            data-name="Group 335"
            transform="translate(0.568 -0.194)"
            clip-path="url(#clip-path)"
          >
            <g
              id="Group_11014"
              data-name="Group 11014"
              transform="translate(1.192 0.364)"
            >
              <g
                id="Group_4037"
                data-name="Group 4037"
                transform="translate(0 0)"
              >
                <g id="Group_4033" data-name="Group 4033">
                  <g id="Group_4032" data-name="Group 4032">
                    <path
                      id="Path_15859"
                      data-name="Path 15859"
                      d="M1.077-.921H18.9l3.368,18.583s-1.685,2.585-2.655,2.585c-.735,0-13.582.424-19.695-.325-1.612-.2-2.174-2.257-2.174-2.257Z"
                      transform="translate(2.798 9.169)"
                      fill="#505050"
                    />
                    <g id="bag-5">
                      <g id="Group_2946" data-name="Group 2946">
                        <path
                          id="Path_15168"
                          data-name="Path 15168"
                          d="M33.579,43.2H51.922a3.585,3.585,0,0,0,3.58-3.58.38.38,0,0,0-.006-.068L52.519,22.745a1.976,1.976,0,0,0-1.961-1.673H48.413V19.036a5.662,5.662,0,1,0-11.324,0v2.034H34.944a1.976,1.976,0,0,0-1.962,1.674L30.005,39.556a.386.386,0,0,0-.006.068A3.585,3.585,0,0,0,33.579,43.2Zm4.29-24.168a4.881,4.881,0,0,1,9.762,0v2.034H37.87Zm-4.117,3.841v-.006a1.2,1.2,0,0,1,1.193-1.018h2.145v3.089a.391.391,0,1,0,.781,0v-3.09h9.762v3.089a.391.391,0,1,0,.781,0V21.852h2.145A1.2,1.2,0,0,1,51.75,22.87v.008l2.972,16.779a2.8,2.8,0,0,1-2.8,2.766H33.579a2.8,2.8,0,0,1-2.8-2.766Z"
                          transform="translate(-29.999 -13.374)"
                          fill="#505050"
                        />
                      </g>
                    </g>
                  </g>
                  <path
                    id="Path_15172"
                    data-name="Path 15172"
                    d="M0,0S3.125,2.668,6.479,2.668,13.414,0,13.414,0"
                    transform="translate(6.044 19.49)"
                    fill="none"
                    stroke="#ffe836"
                    stroke-linecap="round"
                    stroke-width="0.3"
                  />
                </g>
              </g>
            </g>
          </g>
        </svg>
        <span>Add To Bag</span>
      </div>
    </div>
  );
}

export default AddToCartButton;
