import { useSelector } from "react-redux";
import React, { useState } from "react";
import { GetAppLanguage, getUser, translateFunction } from "utils/functions";
import ConfirmMobile from "./ConfirmMobile";
import { useParams } from "next/navigation";

function OrderButton({ close, orderShow, setShowOrder }) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key: string, lang?: string) => {
    return translateFunction(key, languageVariable);
  };
  const [expanded, setExpanded] = useState(false);
  const cart = useSelector((state: StateInterface) => state.cart);
  const [option, setOption] = useState(false);
  const currency_symbol = useSelector(
    (state: StateInterface) => state.homepage.currency
  );
  const ItemsIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="clip-path4">
            <rect
              id="Rectangle_5757"
              data-name="Rectangle 5757"
              width="12"
              height="12"
              transform="translate(20 438)"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Mask_Group_531"
          data-name="Mask Group 531"
          transform="translate(-20 -438)"
          clip-path="url(#clip-path4)"
        >
          <g id="Line_color" transform="translate(19.858 437.855)">
            <g id="Group_12774" data-name="Group 12774">
              <g id="Group_12771" data-name="Group 12771">
                <g id="Group_12770" data-name="Group 12770">
                  <g id="Group_12769" data-name="Group 12769">
                    <path
                      id="Path_22218"
                      data-name="Path 22218"
                      d="M10.037,3.695c-2.507-1.55-5.085.9-5.085.9L2.22,7.331S.746,8.616,2.937,10.8s3.464.717,3.464.717L9.132,8.78s2.455-2.578.9-5.085ZM9.188,5.381a.592.592,0,1,1,0-.838A.592.592,0,0,1,9.188,5.381Z"
                      fill="#1d1d1d"
                    />
                    <g id="Group_12768" data-name="Group 12768">
                      <path
                        id="Path_22219"
                        data-name="Path 22219"
                        d="M10.109,3.571a3.553,3.553,0,0,0-2.17-.519A4.863,4.863,0,0,0,6.1,3.626,5.835,5.835,0,0,0,4.7,4.644L2.779,6.569c-.214.214-.426.429-.642.642a1.814,1.814,0,0,0-.264.323,1.872,1.872,0,0,0-.28,1.092,3.147,3.147,0,0,0,.771,1.75c.76.95,2.073,2.1,3.4,1.681a1.774,1.774,0,0,0,.7-.4c.1-.1.2-.2.3-.3L8.742,9.374a8.045,8.045,0,0,0,.968-1.1,4.611,4.611,0,0,0,.9-3.579,3.61,3.61,0,0,0-.446-1.077c-.1-.158-.346-.013-.249.145a3.3,3.3,0,0,1,.474,2.088,4.593,4.593,0,0,1-.572,1.71,5.511,5.511,0,0,1-.939,1.267L7,10.7l-.667.667-.06.061c-.023.023-.047.045-.072.067l-.051.042c.029-.023-.033.024-.047.033a1.564,1.564,0,0,1-.926.279,2.774,2.774,0,0,1-1.637-.7c-.873-.7-2.007-1.94-1.571-3.168a1.6,1.6,0,0,1,.192-.367c.012-.017.048-.065.029-.041l.044-.053q.031-.036.064-.069l.316-.315L4.555,5.2a7.884,7.884,0,0,1,1-.9,4.381,4.381,0,0,1,3.366-.9,3.351,3.351,0,0,1,1.041.425c.158.1.3-.152.145-.249Z"
                        fill="#3c3c59"
                      />
                      <path
                        id="Path_22220"
                        data-name="Path 22220"
                        d="M9.086,5.28l-.032.029-.014.012c.02-.018.005,0,0,0a.668.668,0,0,1-.076.046s-.036.017-.02.01-.006,0-.01,0l-.017.006a.59.59,0,0,1-.084.021l-.017,0c.032-.005.011,0,0,0l-.04,0H8.74c-.009,0-.055-.006-.019,0a.657.657,0,0,1-.073-.016l-.039-.012-.016-.006c-.016-.005.021.011,0,0a.72.72,0,0,1-.072-.041l-.029-.021c.024.018-.012-.011-.018-.016a.688.688,0,0,1-.059-.063c.018.021,0-.007-.01-.014s-.017-.027-.025-.041-.013-.024-.019-.037.006.017,0-.009a.669.669,0,0,1-.025-.083c0-.013-.005-.026-.007-.04,0,.03,0,0,0-.013a.761.761,0,0,1,0-.086s0-.023,0,0,0,0,0-.009.005-.026.008-.04a.642.642,0,0,1,.025-.077c-.01.027,0,0,.007-.014s.013-.024.02-.036L8.408,4.7l.011-.015c-.012.016,0,.006,0,0a.6.6,0,0,1,.056-.057L8.5,4.6s-.019.013-.005,0l.04-.027.036-.02.021-.01s.02-.009,0,0,.022-.008.026-.009l.045-.013L8.7,4.519l.023,0s-.026,0-.01,0,.057,0,.086,0l.023,0s.023,0,0,0,0,0,0,0l.023,0a.589.589,0,0,1,.084.024l.016.006s-.022-.01-.007,0l.037.018.036.021.015.01s.029.022.014.01,0,0,0,0l.018.016.031.031.028.032s-.013-.019,0-.005l.017.025a.739.739,0,0,1,.045.083c-.012-.025,0,0,0,.014s.01.029.013.044.007.03.01.045,0,.029,0,.009,0,.006,0,.01a.589.589,0,0,1,0,.092s0,.03,0,.01,0,.006,0,.009-.006.03-.01.045-.008.03-.013.044l-.008.022c-.007.02.01-.02,0,0a.868.868,0,0,1-.046.083l-.01.015c-.021.031.011-.011,0,0l-.037.041a.144.144,0,0,0,.2.2.747.747,0,0,0,.142-.84.736.736,0,0,0-.726-.413A.736.736,0,1,0,9.29,5.483a.144.144,0,0,0-.2-.2Z"
                        fill="#3c3c59"
                      />
                    </g>
                  </g>
                </g>
              </g>
              <g id="Group_12773" data-name="Group 12773">
                <g id="Group_12772" data-name="Group 12772">
                  <path
                    id="Path_22221"
                    data-name="Path 22221"
                    d="M10.237,3.9a4.87,4.87,0,0,0,.4-2.452C10.581.965,10.4.24,9.829.153s-.987.51-1.216.937a4.894,4.894,0,0,0-.552,2.351c.009.55.126,1.5.794,1.65.181.04.258-.237.077-.278a.607.607,0,0,1-.388-.367,2.181,2.181,0,0,1-.186-.8,4.667,4.667,0,0,1,.364-2.12A2.818,2.818,0,0,1,9.175.769a.891.891,0,0,1,.5-.334c.443-.062.6.574.658.893A4.446,4.446,0,0,1,9.988,3.75c-.073.168.175.315.248.145Z"
                    fill="#3c3c59"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    );
  };
  const DiscoutIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="clip-path6">
            <rect
              id="Rectangle_5758"
              data-name="Rectangle 5758"
              width="12"
              height="12"
              transform="translate(8 531)"
              fill="none"
            />
          </clipPath>
          <linearGradient
            id="linear-gradient"
            x1="8.529"
            y1="-4.977"
            x2="9.039"
            y2="-4.604"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#f5fbff" />
            <stop offset="1" stop-color="#dbd5ef" />
          </linearGradient>
          <linearGradient
            id="linear-gradient-2"
            x1="0.341"
            y1="0.294"
            x2="0.718"
            y2="0.646"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#dbd5ef" stop-opacity="0" />
            <stop offset="0.285" stop-color="#d9d2ee" stop-opacity="0.286" />
            <stop offset="0.474" stop-color="#d4c9e9" stop-opacity="0.475" />
            <stop offset="0.635" stop-color="#cbbae2" stop-opacity="0.635" />
            <stop offset="0.78" stop-color="#bfa5d7" stop-opacity="0.78" />
            <stop offset="0.913" stop-color="#af8aca" stop-opacity="0.914" />
            <stop offset="1" stop-color="#a274bf" />
          </linearGradient>
          <linearGradient
            id="linear-gradient-3"
            x1="0.202"
            y1="0.339"
            x2="0.677"
            y2="0.503"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#ffa1ae" />
            <stop offset="1" stop-color="#ff4565" />
          </linearGradient>
          <linearGradient
            id="linear-gradient-4"
            x1="0.638"
            y1="0.74"
            x2="0.638"
            y2="0.895"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#fe0364" stop-opacity="0" />
            <stop offset="0.234" stop-color="#f90362" stop-opacity="0.235" />
            <stop offset="0.517" stop-color="#ea035b" stop-opacity="0.518" />
            <stop offset="0.824" stop-color="#d20250" stop-opacity="0.824" />
            <stop offset="1" stop-color="#c00148" />
          </linearGradient>
          <linearGradient
            id="linear-gradient-5"
            x1="0.649"
            y1="0.459"
            x2="0.838"
            y2="0.459"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-6"
            x1="0.173"
            y1="0.461"
            x2="0.901"
            y2="0.675"
            xlinkHref="#linear-gradient-3"
          />
          <linearGradient
            id="linear-gradient-7"
            x1="0.5"
            y1="0.739"
            x2="0.5"
            y2="0.979"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-8"
            x1="0.657"
            y1="0.5"
            x2="0.976"
            y2="0.5"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-9"
            x1="0.585"
            y1="0.384"
            x2="0.14"
            y2="-0.011"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-10"
            x1="18"
            y1="-14.973"
            x2="16.443"
            y2="-15.829"
            xlinkHref="#linear-gradient-3"
          />
          <linearGradient
            id="linear-gradient-11"
            x1="1.411"
            y1="0.777"
            x2="-0.08"
            y2="0.333"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-12"
            x1="10.78"
            y1="-8.893"
            x2="11.435"
            y2="-8.281"
            xlinkHref="#linear-gradient"
          />
          <linearGradient
            id="linear-gradient-13"
            x1="0.541"
            y1="0.55"
            x2="0.679"
            y2="0.947"
            xlinkHref="#linear-gradient-2"
          />
          <linearGradient
            id="linear-gradient-14"
            x1="0.034"
            y1="0.5"
            x2="1.046"
            y2="0.5"
            xlinkHref="#linear-gradient-2"
          />
          <linearGradient
            id="linear-gradient-15"
            x1="0.565"
            y1="0.502"
            x2="-0.015"
            y2="0.498"
            xlinkHref="#linear-gradient-2"
          />
          <linearGradient
            id="linear-gradient-16"
            x1="0.811"
            y1="0.5"
            x2="0.052"
            y2="0.5"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-17"
            x1="0.5"
            y1="0.374"
            x2="0.5"
            y2="0.102"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-18"
            x1="0.862"
            y1="0.629"
            x2="0.184"
            y2="0.346"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-19"
            x1="0.588"
            y1="0.545"
            x2="0.22"
            y2="0.415"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-20"
            x1="0.954"
            y1="0.5"
            x2="0.156"
            y2="0.5"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-21"
            x1="0.5"
            y1="0.363"
            x2="0.5"
            y2="0.101"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-22"
            x1="0.835"
            y1="0.589"
            x2="0.289"
            y2="0.327"
            xlinkHref="#linear-gradient-4"
          />
          <linearGradient
            id="linear-gradient-23"
            x1="-0.004"
            y1="0.306"
            x2="0.86"
            y2="0.64"
            xlinkHref="#linear-gradient"
          />
          <linearGradient
            id="linear-gradient-24"
            x1="0.5"
            y1="0.368"
            x2="0.5"
            y2="1.022"
            xlinkHref="#linear-gradient-2"
          />
          <linearGradient
            id="linear-gradient-25"
            x1="0.592"
            y1="0.504"
            x2="0.797"
            y2="0.92"
            xlinkHref="#linear-gradient-2"
          />
          <linearGradient
            id="linear-gradient-26"
            x1="0.416"
            y1="0.5"
            x2="0.997"
            y2="0.5"
            xlinkHref="#linear-gradient-2"
          />
          <linearGradient
            id="linear-gradient-27"
            x1="0.426"
            y1="0.48"
            x2="0.538"
            y2="0.512"
            xlinkHref="#linear-gradient"
          />
          <linearGradient
            id="linear-gradient-28"
            x1="0.393"
            y1="0.472"
            x2="0.598"
            y2="0.528"
            xlinkHref="#linear-gradient-2"
          />
          <linearGradient
            id="linear-gradient-29"
            x1="0.599"
            y1="0.323"
            x2="0.3"
            y2="1.006"
            xlinkHref="#linear-gradient-2"
          />
        </defs>
        <g
          id="Mask_Group_532"
          data-name="Mask Group 532"
          transform="translate(-8 -531)"
          clip-path="url(#clip-path6)"
        >
          <g
            id="_3d-discount"
            data-name="3d-discount"
            transform="translate(8 531)"
          >
            <g id="Group_12782" data-name="Group 12782">
              <g id="Group_12775" data-name="Group 12775">
                <path
                  id="Path_22222"
                  data-name="Path 22222"
                  d="M7.669,3.636c-.652,0-1.144-.782-1.144-1.818S7.017,0,7.669,0,8.813.782,8.813,1.818,8.321,3.636,7.669,3.636Zm0-.772c.093,0,.372-.371.372-1.046S7.762.772,7.669.772,7.3,1.143,7.3,1.818,7.577,2.864,7.669,2.864Z"
                  fill="url(#linear-gradient)"
                />
              </g>
              <path
                id="Path_22223"
                data-name="Path 22223"
                d="M7.3,1.818c0-.675.279-1.046.372-1.046H6.722a2.68,2.68,0,0,0-.2,1.046,2.787,2.787,0,0,0,.141.9l.678-.448A2.149,2.149,0,0,1,7.3,1.818Z"
                fill="url(#linear-gradient-2)"
              />
              <g id="Group_12776" data-name="Group 12776">
                <path
                  id="Path_22224"
                  data-name="Path 22224"
                  d="M5.991,11.934,1.624,9.9a.7.7,0,0,1-.341-.937L4.11,2.9a.7.7,0,0,1,.515-.4l2.9-.518a.7.7,0,0,1,.735.343L9.727,4.881a.7.7,0,0,1,.028.649L6.928,11.593a.7.7,0,0,1-.937.341Z"
                  fill="url(#linear-gradient-3)"
                />
                <path
                  id="Path_22225"
                  data-name="Path 22225"
                  d="M2.575,6.191,1.283,8.961a.7.7,0,0,0,.341.937l4.367,2.036a.7.7,0,0,0,.937-.341l1.292-2.77Z"
                  fill="url(#linear-gradient-4)"
                />
                <path
                  id="Path_22226"
                  data-name="Path 22226"
                  d="M9.727,4.881,8.26,2.327a.7.7,0,0,0-.735-.343l-.691.123L2.92,10.5l3.071,1.432a.7.7,0,0,0,.937-.341L9.755,5.53a.7.7,0,0,0-.028-.649Z"
                  fill="url(#linear-gradient-5)"
                />
              </g>
              <g id="Group_12777" data-name="Group 12777">
                <path
                  id="Path_22227"
                  data-name="Path 22227"
                  d="M10.078,11.661H5.26a.7.7,0,0,1-.7-.7V4.266a.7.7,0,0,1,.3-.576l2.409-1.7a.7.7,0,0,1,.811,0l2.409,1.7a.7.7,0,0,1,.3.576v6.69A.7.7,0,0,1,10.078,11.661Z"
                  fill="url(#linear-gradient-6)"
                />
                <path
                  id="Path_22228"
                  data-name="Path 22228"
                  d="M4.555,7.9v3.057a.7.7,0,0,0,.7.7h4.819a.7.7,0,0,0,.7-.7V7.9Z"
                  fill="url(#linear-gradient-7)"
                />
                <path
                  id="Path_22229"
                  data-name="Path 22229"
                  d="M10.484,3.69l-2.409-1.7a.7.7,0,0,0-.811,0l-.574.4v9.262h3.389a.7.7,0,0,0,.7-.7V4.266a.7.7,0,0,0-.3-.576Z"
                  fill="url(#linear-gradient-8)"
                />
              </g>
              <g id="Group_12780" data-name="Group 12780">
                <path
                  id="Path_22230"
                  data-name="Path 22230"
                  d="M7.254,3.636l3.53,3.53v-2.9a.7.7,0,0,0-.3-.576L8.556,2.333Z"
                  fill="url(#linear-gradient-9)"
                />
                <path
                  id="Path_22231"
                  data-name="Path 22231"
                  d="M7.669,3.789a.639.639,0,1,0-.237-1.232l-.355.833A.639.639,0,0,0,7.669,3.789Z"
                  fill="url(#linear-gradient-10)"
                />
                <path
                  id="Path_22232"
                  data-name="Path 22232"
                  d="M7.669,3.789a.639.639,0,1,0-.237-1.232l-.355.833A.639.639,0,0,0,7.669,3.789Z"
                  fill="url(#linear-gradient-11)"
                />
                <g id="Group_12778" data-name="Group 12778">
                  <path
                    id="Path_22233"
                    data-name="Path 22233"
                    d="M7.669,3.636a.865.865,0,0,0,.593-.247,2.153,2.153,0,0,0,.552-1.571c0-.019,0-.037,0-.056a3.1,3.1,0,0,0-.025-.341H8.006a2.111,2.111,0,0,1,.034.341q0,.027,0,.056a1.912,1.912,0,0,1-.135.739c-.085.2-.188.307-.237.307s-.152-.106-.237-.307a.638.638,0,0,0-.355.833.865.865,0,0,0,.592.246Z"
                    fill="url(#linear-gradient-12)"
                  />
                </g>
                <g id="Group_12779" data-name="Group 12779">
                  <path
                    id="Path_22234"
                    data-name="Path 22234"
                    d="M7.669,3.636a.865.865,0,0,0,.593-.247,2.153,2.153,0,0,0,.552-1.571c0-.019,0-.037,0-.056a3.1,3.1,0,0,0-.025-.341H8.006a2.111,2.111,0,0,1,.034.341q0,.027,0,.056a1.912,1.912,0,0,1-.135.739c-.085.2-.188.307-.237.307s-.152-.106-.237-.307a.638.638,0,0,0-.355.833.865.865,0,0,0,.592.246Z"
                    fill="url(#linear-gradient-13)"
                  />
                </g>
              </g>
              <path
                id="Path_22235"
                data-name="Path 22235"
                d="M7.692,2.858a1.3,1.3,0,0,0,.348-1.04A1.3,1.3,0,0,0,7.692.779V0c.641.018,1.121.793,1.121,1.817s-.48,1.8-1.121,1.817Z"
                fill="url(#linear-gradient-14)"
              />
              <g id="Group_12781" data-name="Group 12781">
                <path
                  id="Path_22236"
                  data-name="Path 22236"
                  d="M7.872,2.631c-.077.153-.16.233-.2.233s-.152-.106-.237-.307a.639.639,0,0,0-.355.833.835.835,0,0,0,1.184,0A1.679,1.679,0,0,0,8.7,2.631H7.872Z"
                  fill="url(#linear-gradient-15)"
                />
              </g>
            </g>
            <ellipse
              id="Ellipse_283"
              data-name="Ellipse 283"
              cx="0.536"
              cy="0.836"
              rx="0.536"
              ry="0.836"
              transform="translate(5.832 6.145)"
              fill="url(#linear-gradient-16)"
            />
            <ellipse
              id="Ellipse_284"
              data-name="Ellipse 284"
              cx="0.536"
              cy="0.836"
              rx="0.536"
              ry="0.836"
              transform="translate(5.832 6.145)"
              fill="url(#linear-gradient-17)"
            />
            <path
              id="Path_22237"
              data-name="Path 22237"
              d="M6.957,9.179,5.712,7.934h.542a.774.774,0,0,0,.774-.774V6.033l1,1Z"
              fill="url(#linear-gradient-18)"
            />
            <path
              id="Path_22238"
              data-name="Path 22238"
              d="M10.783,10.956V7.574L8.906,5.7,6.47,10.122l1.539,1.539h2.07A.7.7,0,0,0,10.783,10.956Z"
              fill="url(#linear-gradient-19)"
            />
            <ellipse
              id="Ellipse_285"
              data-name="Ellipse 285"
              cx="0.491"
              cy="0.825"
              rx="0.491"
              ry="0.825"
              transform="translate(8.479 7.981)"
              fill="url(#linear-gradient-20)"
            />
            <ellipse
              id="Ellipse_286"
              data-name="Ellipse 286"
              cx="0.491"
              cy="0.825"
              rx="0.491"
              ry="0.825"
              transform="translate(8.479 7.981)"
              fill="url(#linear-gradient-21)"
            />
            <path
              id="Path_22239"
              data-name="Path 22239"
              d="M10.783,9.012,9.635,7.863V8.882a.86.86,0,0,1-.823.859l-.5.021L10.2,11.649a.7.7,0,0,0,.579-.693Z"
              fill="url(#linear-gradient-22)"
            />
            <g id="Group_12783" data-name="Group 12783">
              <path
                id="Path_22240"
                data-name="Path 22240"
                d="M7.153,6.221a.608.608,0,0,0-.182-.238.73.73,0,0,0-.272-.13,1.343,1.343,0,0,0-.332-.04,1.367,1.367,0,0,0-.338.04.7.7,0,0,0-.269.13.617.617,0,0,0-.179.238.879.879,0,0,0-.065.357v.805a.88.88,0,0,0,.065.357.617.617,0,0,0,.179.238.7.7,0,0,0,.269.131,1.368,1.368,0,0,0,.338.04,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.131.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357V6.578A.883.883,0,0,0,7.153,6.221Zm-.5,1.162a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272V6.578a.243.243,0,0,1,.278-.272.309.309,0,0,1,.207.065.258.258,0,0,1,.077.207Z"
                fill="url(#linear-gradient-23)"
              />
              <path
                id="Path_22241"
                data-name="Path 22241"
                d="M6.651,6.763v.62a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272v-.62H5.517v.62a.88.88,0,0,0,.065.357.617.617,0,0,0,.179.238.7.7,0,0,0,.269.131,1.368,1.368,0,0,0,.338.04,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.131.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357v-.62Z"
                fill="url(#linear-gradient-24)"
              />
              <path
                id="Path_22242"
                data-name="Path 22242"
                d="M6.651,6.763v.62a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272v-.62H5.517v.62a.88.88,0,0,0,.065.357.617.617,0,0,0,.179.238.7.7,0,0,0,.269.131,1.368,1.368,0,0,0,.338.04,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.131.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357v-.62Z"
                fill="url(#linear-gradient-25)"
              />
              <path
                id="Path_22243"
                data-name="Path 22243"
                d="M6.972,5.983a.73.73,0,0,0-.272-.13,1.343,1.343,0,0,0-.332-.04,1.405,1.405,0,0,0-.278.027v.739a.243.243,0,0,1,.278-.272.309.309,0,0,1,.207.065.258.258,0,0,1,.077.207v.805a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272v.739a1.411,1.411,0,0,0,.278.027,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.13.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357V6.578a.883.883,0,0,0-.065-.357.608.608,0,0,0-.182-.238Z"
                fill="url(#linear-gradient-26)"
              />
            </g>
            <g id="Group_12784" data-name="Group 12784">
              <path
                id="Path_22244"
                data-name="Path 22244"
                d="M8.642,5.58a.368.368,0,0,1,.227.082.261.261,0,0,1,.108.218.239.239,0,0,1-.023.108l-2,4.088a.223.223,0,0,1-.1.1.32.32,0,0,1-.153.04.294.294,0,0,1-.232-.1.3.3,0,0,1-.085-.2.241.241,0,0,1,.028-.108L8.4,5.722a.226.226,0,0,1,.1-.108.292.292,0,0,1,.142-.034Z"
                fill="url(#linear-gradient-27)"
              />
              <path
                id="Path_22245"
                data-name="Path 22245"
                d="M8.642,5.58a.368.368,0,0,1,.227.082.261.261,0,0,1,.108.218.239.239,0,0,1-.023.108l-2,4.088a.223.223,0,0,1-.1.1.32.32,0,0,1-.153.04.294.294,0,0,1-.232-.1.3.3,0,0,1-.085-.2.241.241,0,0,1,.028-.108L8.4,5.722a.226.226,0,0,1,.1-.108.292.292,0,0,1,.142-.034Z"
                fill="url(#linear-gradient-28)"
              />
              <path
                id="Path_22246"
                data-name="Path 22246"
                d="M6.827,8.959l-.414.851a.241.241,0,0,0-.028.108.3.3,0,0,0,.085.2.294.294,0,0,0,.232.1.32.32,0,0,0,.153-.04.223.223,0,0,0,.1-.1l.324-.663Z"
                fill="url(#linear-gradient-29)"
              />
            </g>
            <g id="Group_12785" data-name="Group 12785">
              <path
                id="Path_22247"
                data-name="Path 22247"
                d="M9.756,8.047a.608.608,0,0,0-.182-.238.73.73,0,0,0-.272-.13,1.343,1.343,0,0,0-.332-.04,1.367,1.367,0,0,0-.338.04.7.7,0,0,0-.269.13.617.617,0,0,0-.179.238A.879.879,0,0,0,8.12,8.4v.805a.88.88,0,0,0,.065.357.617.617,0,0,0,.179.238.7.7,0,0,0,.269.13,1.368,1.368,0,0,0,.338.04,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.13.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357V8.4A.883.883,0,0,0,9.756,8.047Zm-.5,1.162a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272V8.4a.243.243,0,0,1,.278-.272.309.309,0,0,1,.207.065.258.258,0,0,1,.077.207Z"
                fill="url(#linear-gradient-23)"
              />
              <path
                id="Path_22248"
                data-name="Path 22248"
                d="M9.254,8.589v.62a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272v-.62H8.12v.62a.88.88,0,0,0,.065.357.617.617,0,0,0,.179.238.7.7,0,0,0,.269.13,1.368,1.368,0,0,0,.338.04,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.13.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357v-.62Z"
                fill="url(#linear-gradient-24)"
              />
              <path
                id="Path_22249"
                data-name="Path 22249"
                d="M9.254,8.589v.62a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272v-.62H8.12v.62a.88.88,0,0,0,.065.357.617.617,0,0,0,.179.238.7.7,0,0,0,.269.13,1.368,1.368,0,0,0,.338.04,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.13.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357v-.62Z"
                fill="url(#linear-gradient-25)"
              />
              <path
                id="Path_22250"
                data-name="Path 22250"
                d="M9.574,7.809a.73.73,0,0,0-.272-.13,1.343,1.343,0,0,0-.332-.04,1.405,1.405,0,0,0-.278.027V8.4a.243.243,0,0,1,.278-.272.309.309,0,0,1,.207.065.258.258,0,0,1,.077.207v.805a.258.258,0,0,1-.077.207.308.308,0,0,1-.207.065.243.243,0,0,1-.278-.272v.739a1.411,1.411,0,0,0,.278.027,1.343,1.343,0,0,0,.332-.04.727.727,0,0,0,.272-.13.607.607,0,0,0,.182-.238.884.884,0,0,0,.065-.357V8.4a.883.883,0,0,0-.065-.357A.608.608,0,0,0,9.574,7.809Z"
                fill="url(#linear-gradient-26)"
              />
            </g>
          </g>
        </g>
      </svg>
    );
  };
  const GiftIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <defs>
          <clipPath id="clip-path66">
            <rect
              id="Rectangle_5764"
              data-name="Rectangle 5764"
              width="12"
              height="12"
              transform="translate(28 566)"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Mask_Group_534"
          data-name="Mask Group 534"
          transform="translate(-28 -566)"
          clip-path="url(#clip-path66)"
        >
          <g id="money-9" transform="translate(28 566)">
            <g id="Group_12791" data-name="Group 12791">
              <g id="Group_12790" data-name="Group 12790">
                <path
                  id="Path_22251"
                  data-name="Path 22251"
                  d="M.164,6.016a.25.25,0,0,0-.148.32l.157.432,1.2-1.2Z"
                  fill="#5ba260"
                />
              </g>
            </g>
            <g id="Group_12793" data-name="Group 12793">
              <g id="Group_12792" data-name="Group 12792">
                <path
                  id="Path_22252"
                  data-name="Path 22252"
                  d="M1.3,9.855l.72,1.98a.248.248,0,0,0,.129.141A.251.251,0,0,0,2.25,12a.245.245,0,0,0,.087-.015l.794-.293Z"
                  fill="#5ba260"
                />
              </g>
            </g>
            <g id="Group_12795" data-name="Group 12795">
              <g id="Group_12794" data-name="Group 12794">
                <path
                  id="Path_22253"
                  data-name="Path 22253"
                  d="M11.985,8.165,11.161,5.9,9.183,7.877l.98-.361a.25.25,0,0,1,.173.469l-1.245.459A.25.25,0,0,1,8.77,8.3s0,0,0,0l-2.1,2.1,5.162-1.9A.249.249,0,0,0,11.985,8.165Z"
                  fill="#5ba260"
                />
              </g>
            </g>
            <g id="Group_12797" data-name="Group 12797">
              <g id="Group_12796" data-name="Group 12796">
                <path
                  id="Path_22254"
                  data-name="Path 22254"
                  d="M11.927,4.073l-4-4a.25.25,0,0,0-.353,0l-7.5,7.5a.25.25,0,0,0,0,.353l4,4A.247.247,0,0,0,4.25,12a.251.251,0,0,0,.177-.073l7.5-7.5A.251.251,0,0,0,11.927,4.073Zm-9,2.854-1,1a.25.25,0,0,1-.354-.353l1-1a.25.25,0,0,1,.354.354Zm4.317.317a.944.944,0,0,1-.685.262,2.066,2.066,0,0,1-1.39-.664,2.291,2.291,0,0,1-.624-1.064,1.045,1.045,0,0,1,.222-1.011,1.041,1.041,0,0,1,1.011-.222,2.286,2.286,0,0,1,1.064.624C7.537,5.863,7.714,6.775,7.244,7.245Zm3.182-2.817-1,1a.25.25,0,0,1-.354-.353l1-1a.25.25,0,0,1,.354.353Z"
                  fill="#5ba260"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    );
  };
  const MenuIcon = ({ className }) => {
    return (
      <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="6"
        viewBox="0 0 10 6"
      >
        <g id="Path_15448" data-name="Path 15448" fill="#1d1d1d">
          <path
            d="M 8.818389892578125 5.899997234344482 L 1.181609988212585 5.899997234344482 C 0.7388899922370911 5.899997234344482 0.3578200042247772 5.624197006225586 0.1871100068092346 5.180217266082764 C -0.001460000057704747 4.689786911010742 0.1188699975609779 4.154346942901611 0.4936699867248535 3.81611704826355 L 4.312049865722656 0.3702371418476105 C 4.505149841308594 0.1959771364927292 4.749470233917236 0.100007139146328 5 0.100007139146328 C 5.250529766082764 0.100007139146328 5.494840145111084 0.1959771364927292 5.687940120697021 0.3702371418476105 L 9.506329536437988 3.81611704826355 C 9.881130218505859 4.154346942901611 10.00146007537842 4.689786911010742 9.81289005279541 5.180217266082764 C 9.642180442810059 5.624186992645264 9.261110305786133 5.899997234344482 8.818389892578125 5.899997234344482 Z"
            stroke="none"
          />
          <path
            d="M 5 0.1999969482421875 C 4.774270057678223 0.1999969482421875 4.55374002456665 0.2868170738220215 4.379039764404297 0.4444770812988281 L 0.5606603622436523 3.890357255935669 C 0.2168397903442383 4.200636863708496 0.1068496704101562 4.69284725189209 0.2804498672485352 5.144327163696289 C 0.4383096694946289 5.554887294769287 0.7751903533935547 5.799997329711914 1.181610107421875 5.799997329711914 L 8.818380355834961 5.799997329711914 C 9.224800109863281 5.799997329711914 9.561690330505371 5.554887294769287 9.719550132751465 5.144317150115967 C 9.893150329589844 4.692837238311768 9.783160209655762 4.200627326965332 9.439339637756348 3.890357255935669 L 5.620950222015381 0.4444770812988281 C 5.446249961853027 0.2868170738220215 5.225729942321777 0.1999969482421875 5 0.1999969482421875 M 4.999998569488525 1.9073486328125e-06 C 5.268139839172363 1.9073486328125e-06 5.536280155181885 0.09866714477539062 5.754940032958984 0.295997142791748 L 9.573329925537109 3.74187707901001 C 10.42065048217773 4.506526947021484 9.921339988708496 5.999997138977051 8.818380355834961 5.999997138977051 L 1.181610107421875 5.999997138977051 C 0.07865047454833984 5.999997138977051 -0.420649528503418 4.506526947021484 0.4266700744628906 3.74187707901001 L 4.245049953460693 0.295997142791748 C 4.463715076446533 0.09866714477539062 4.731857299804688 1.9073486328125e-06 4.999998569488525 1.9073486328125e-06 Z"
            stroke="none"
            fill="#fff"
          />
        </g>
      </svg>
    );
  };
  const getDiscount = () => {
    var a = parseInt(
      ((cart.total_discount_on_product / cart.sub_total) * 100).toString()
    );
    return a;
  };
  return (
    <>
      {expanded && (
        <div
          className="fixed min-w-[100vw] min-h-[100vh] opacity-40 bg-[black]"
          onClick={() => {
            setExpanded(false);
          }}
        />
      )}
      <div className="flex-col z-50 fixed bottom-1 left-0 bg-white min-h-[100px] w-full">
        {cart.cart.length > 0 && (
          <div
            className={`flex-col w-full ${
              expanded
                ? "h-[336px] pt-[20px] px-[12px] pb-[10x] rounded-t-[30x]"
                : "h-[76px] pt-[20px] px-[12px] pb-[10x] rounded-t-[30x]"
            }  transition-all`}
          >
            {expanded && (
              <>
                <div className="flex-row items-center">
                  <ItemsIcon />
                  <span className="ml-[5px] medium text-[#1D1D1D] text-[13px]">
                    Item <span className="mt-1 bold">{cart.cart.length}</span>{" "}
                  </span>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-2">
                  <div className="flex-col pl-[28px] text-[#1D1D1D]">
                    <span className="medium text-[13px]">Price</span>
                    <span className="regular text-[11px]">Normal Price</span>
                  </div>
                  <span className="ml-[5px] medium text-[#1D1D1D] text-[13px] pr-[13px]">
                    {cart.sub_total} {currency_symbol.symbol}
                  </span>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-2 bg-[#FDFDEF] rounded-[12px] pt-1">
                  <div className="flex-row pl-[12px]">
                    <span className="flex-row translate-y-[3px]">
                      <DiscoutIcon />
                    </span>{" "}
                    <div className="flex-col pl-1 text-[#A28E5B]">
                      <span className="medium text-[13px] text-[#A28E5B]">
                        Total Discount{" "}
                        <span className="bold text-[#A28E5B] ">
                          {getDiscount()}%
                        </span>
                      </span>
                      <span className="regular text-[11px] text-[#A28E5B]">
                        Click To Show All Discount
                      </span>
                    </div>
                  </div>

                  <span className="ml-[5px] bold  text-[13px] pr-[13px] text-[#A28E5B]">
                    {cart.total_discount_on_product} {currency_symbol.symbol}
                  </span>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-2 rounded-[12px] pt-1">
                  <div className="flex-row pl-[12px]">
                    <span className="flex-row translate-y-[3px]">
                      <GiftIcon />
                    </span>{" "}
                    <div className="flex-col pl-1 text-[#5BA260]">
                      <span className="medium text-[13px] text-[#5BA260]">
                        Gift
                      </span>
                      <span className="regular text-[11px] text-[#5BA260]">
                        First Shopping
                      </span>
                    </div>
                  </div>

                  <span className="ml-[5px] bold  text-[13px] pr-[13px] text-[#5BA260]">
                    {-10} {currency_symbol.symbol}
                  </span>
                </div>
                <div className="flex-row items-start h-[50px] w-full justify-between mt-2 rounded-[12px] pt-1">
                  <div className="flex-row pl-[12px]">
                    <span className="flex-row translate-y-[3px]">
                      <GiftIcon />
                    </span>{" "}
                    <div className="flex-col pl-1 text-[#5BA260]">
                      <span className="medium text-[13px] text-[#5BA260]">
                        Shipping
                      </span>
                      <span className="regular text-[11px] text-[#5BA260]">
                        Shipping Is Completely Free Without Any Extras
                      </span>
                    </div>
                  </div>

                  <span className="ml-[5px] bold  text-[13px] pr-[13px] text-[#5BA260]">
                    <span className="line-through">10</span>
                    {cart.total_shipping_cost} {currency_symbol.symbol}
                  </span>
                </div>
              </>
            )}
            {!orderShow && (
              <div
                onClick={() => {
                  setExpanded(!expanded);
                }}
                className=" cursor-pointer flex-row items-center h-[50px] w-full justify-between mt-2 rounded-[12px] pt-1 bg-[#F8F8F8]"
              >
                <div className="flex-row pl-[12px]">
                  <div className="flex-col pl-4 text-[#1D1D1D]">
                    <span className="bold text-[13px] text-[#1D1D1D]">
                      Total
                    </span>
                    <span className="medium text-[11px] text-[#8D8D8D]">
                      {translate("All Inclusive Without Additions")}
                    </span>
                  </div>
                </div>

                <span className="flex-row justify-center items-center ml-[5px] bold  text-[16px] pr-[13px] text-[#1D1D1D]">
                  <span className="line-through regular mr-2">
                    {cart.sub_total}
                  </span>{" "}
                  {cart.total_cash} {currency_symbol.symbol}
                  <span className="ml-2">
                    <MenuIcon className={expanded && "rotate-180"} />
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
        <div className="flex-row w-full px-5 pt-3">
          <div
            className={`cursor-pointer  flex-col w-full  ${
              option ? "h-[200px]" : "bg-[#3C3C3C] h-[70px]"
            } rounded-[20px] text-center justify-center items-center`}
            style={{
              boxShadow:
                "inset 0px 3px 6px rgba(255,255,255,0.16), 0px 3px 6px rgba(0,0,0,0.1)",
            }}
            onClick={() => {
              if (orderShow) {
                setShowOrder(false);
              } else if (cart.cart.length === 0) {
                close();
              } else {
                if (!getUser()) {
                  setOption(true);
                }
              }
            }}
          >
            <>
              {option ? (
                <>
                  <ConfirmMobile
                    closeWindow={() => {
                      setOption(false);
                      setShowOrder(true);
                    }}
                  />
                </>
              ) : (
                <>
                  {" "}
                  {cart.cart.length === 0 || orderShow ? (
                    <>
                      <span className="text-[#FEFEFE] text-[18px] medium ">
                        {orderShow
                          ? translate("Back To Cart")
                          : translate("Back To Home", GetAppLanguage())}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#FEFEFE] text-[18px] medium ">
                        {translate("Confirm And Continue", GetAppLanguage())}
                      </span>
                      <span className="text-[#FEFEFE] text-[14px] medium ">
                        {cart.cart.length} items {cart.total_cash}{" "}
                        {currency_symbol?.symbol}
                      </span>
                    </>
                  )}
                </>
              )}
            </>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderButton;
