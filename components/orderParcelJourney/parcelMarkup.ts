/*
  Authentic Trydos SVG stage for OrderParcelJourney (Timeline #2).
  Reuses authentic Trydos icon geometry (claim, work bench & boxes, productBox,
  rocket-2, GreenBigTruck, delivery_location, shopping-3, OrderSuccess) paired
  with a multi-actor cast (Catcher, Packer, Final-Mile Courier, Doorstep Customer,
  Rocket & Green Big Truck) using isolated "opj-" IDs so it coexists cleanly
  on the same page as OrderJourney ("oj-").
*/
export const PARCEL_SVG = `
  <defs>
    <image id="opj-prodImg" width="642" height="933" href="/assets/demo/listing/product-tshirt.webp"/>
    <clipPath id="opj-tileClip" clipPathUnits="userSpaceOnUse">
      <rect x="-11" y="-13.5" width="22" height="27" rx="4.5"/>
    </clipPath>

    <!-- Authentic Trydos "claim" (Buy) icon from OrderStatusIcon.tsx -->
    <g id="opj-ic-buy" fill="currentColor">
      <path fill-rule="evenodd" transform="translate(-0.388 -0.389)" d="M1.1,9.718a.217.217,0,0,1-.418.112A7.477,7.477,0,1,1,5.563,15a.217.217,0,1,1,.136-.411A7.043,7.043,0,1,0,1.1,9.718Zm9.3-4.011a.615.615,0,0,1,.852.888L7.635,10.069a.615.615,0,0,1-.848,0l-2.225-2.1a.615.615,0,1,1,.844-.9l1.8,1.7Zm-5.14,5.018a.217.217,0,1,1-.309-.3l.309-.314a.217.217,0,0,1,.309.3Zm-1.3-.474a.217.217,0,0,1-.419-.109l.11-.426a.217.217,0,0,1,.419.109Zm1.6,1.876a.217.217,0,1,1-.115-.417l.424-.117a.217.217,0,1,1,.115.417Zm-3.055,2L1.345,15.288a.155.155,0,0,1-.219,0L.433,14.6a.155.155,0,0,1,0-.219L1.59,13.219l-.734-.4a.155.155,0,0,1,.021-.281l3.34-1.229a.155.155,0,0,1,.2.2l-1.229,3.34a.155.155,0,0,1-.281.021Z"/>
    </g>

    <!-- Authentic Trydos "rocket-2" icon from OrderStatusIcon.tsx -->
    <g id="opj-ic-rocket" fill="currentColor">
      <path d="M2.431,6.932l2.119.16c.223-.55.466-1.1.726-1.623.283-.579.617-1.263,1-1.924A7.412,7.412,0,0,0,2.431,6.932Z"/>
      <path d="M7.741,10.231,7.9,12.339a7.519,7.519,0,0,0,3.417-3.8c-.3.168-.629.342-1.006.528-.178.1-.342.179-.493.251-.255.122-.514.241-.791.362-.423.2-.857.381-1.29.553Z"/>
      <path d="M14.871.026a12.282,12.282,0,0,0-3.661.3l3.355,3.315a10.862,10.862,0,0,0,.3-1.906c.027-.394.019-1.561.01-1.709Z"/>
      <circle cx="0.907" cy="0.907" r="0.907" transform="translate(9.359 3.668)"/>
      <path d="M10.64.484a6.433,6.433,0,0,0-2.715,1.64A14.746,14.746,0,0,0,5.738,5.692,23.981,23.981,0,0,0,4.375,9.1L5.7,10.405A24.614,24.614,0,0,0,9.148,9.058,14.137,14.137,0,0,0,12.759,6.9,6.34,6.34,0,0,0,14.4,4.2Zm-.374,5.6a1.512,1.512,0,1,1,1.512-1.512A1.512,1.512,0,0,1,10.266,6.087Z"/>
    </g>
    <g id="opj-ic-rocket-lines" fill="currentColor">
      <path d="M.531,14.847a.258.258,0,0,1-.185-.433l3.518-3.622a.258.258,0,0,1,.363-.006.255.255,0,0,1,.006.361L.716,14.769a.257.257,0,0,1-.185.078Z"/>
      <path d="M3.007,15a.258.258,0,0,1-.192-.425l2.28-2.552A.258.258,0,0,1,5.458,12a.255.255,0,0,1,.021.361L3.2,14.914A.257.257,0,0,1,3.007,15Z"/>
      <path d="M.376,12.554a.258.258,0,0,1-.192-.425l2.28-2.552a.258.258,0,0,1,.363-.021.255.255,0,0,1,.021.361L.568,12.468a.257.257,0,0,1-.192.086Z"/>
    </g>

    <!-- Authentic Trydos "work" bench desk & under-bench shelf boxes (OrderStatusIcon.tsx) -->
    <g id="opj-ic-bench-desk" fill="currentColor">
      <path d="M4.739,10.128v5.131H7.132V12.182h4.288v3.077h.312V12.182H15.4V10.128Z" transform="translate(-0.79 -1.192)"/>
    </g>
    <g id="opj-ic-bench-shelves" fill="currentColor">
      <path d="M12.173,8.75h2.919v.877H12.173Z" transform="translate(-2.029 -0.962)"/>
      <path d="M12.416,7.484h2.919v.878H12.416Z" transform="translate(-2.069 -0.751)"/>
    </g>
    <g id="opj-ic-bench-boxL" fill="currentColor">
      <path d="M11.714,12.868H10.243V14.4l-.167-.114-.151.114-.141-.114-.161.114-.158-.114-.108.114v-1.53H7.886v3.183h3.829Z" transform="translate(-1.314 -1.649)"/>
    </g>
    <g id="opj-ic-bench-boxR" fill="currentColor">
      <path d="M13.406,16.051h3.829V12.868H15.763V14.4l-.167-.114-.151.114-.141-.114-.161.114-.158-.114-.108.114v-1.53H13.406Z" transform="translate(-2.234 -1.649)"/>
    </g>

    <!-- Authentic Trydos "productBox" carton icon (public/assets/demo/xd/productBox.svg) centered at 0,0 -->
    <g id="opj-ic-box" fill="currentColor">
      <g transform="translate(-10.5 -9.38)">
        <path d="M 15.18 2.49 L 5.84 2.49 C 5.02 2.49 4.36 3.15 4.36 3.97 L 4.36 14.78 C 4.36 15.6 5.02 16.26 5.84 16.26 L 15.18 16.26 C 15.99 16.26 16.65 15.6 16.65 14.78 L 16.65 3.97 C 16.65 3.15 15.99 2.49 15.18 2.49 Z M 16.16 14.78 C 16.16 15.33 15.72 15.77 15.18 15.77 L 5.84 15.77 C 5.3 15.77 4.86 15.33 4.86 14.78 L 4.86 3.97 C 4.86 3.42 5.3 2.99 5.84 2.99 L 8.3 2.99 L 8.3 6.74 C 8.3 6.99 8.43 7.23 8.65 7.37 C 8.86 7.5 9.13 7.51 9.36 7.4 L 10.4 6.88 C 10.46 6.85 10.54 6.85 10.61 6.88 L 11.65 7.4 C 11.87 7.51 12.15 7.5 12.37 7.37 C 12.58 7.23 12.72 7 12.71 6.74 L 12.71 2.98 L 15.18 2.98 C 15.72 2.98 16.16 3.42 16.16 3.96 L 16.16 14.78 Z"/>
        <path transform="translate(-3.02 -13.21)" d="M 13.03 24.3 L 10.09 24.3 C 9.68 24.31 9.35 24.63 9.35 25.04 L 9.35 27.34 C 9.35 27.75 9.68 28.07 10.09 28.08 L 13.03 28.08 C 13.44 28.07 13.77 27.75 13.77 27.34 L 13.77 25.04 C 13.77 24.64 13.44 24.31 13.03 24.3 Z M 10.33 26.69 C 10.33 26.55 10.44 26.44 10.58 26.44 L 12.54 26.44 C 12.68 26.44 12.79 26.55 12.79 26.69 C 12.79 26.82 12.68 26.93 12.54 26.93 L 10.58 26.93 C 10.44 26.93 10.33 26.82 10.33 26.69 Z M 12.54 25.95 L 10.58 25.95 C 10.44 25.95 10.33 25.84 10.33 25.7 C 10.33 25.57 10.44 25.46 10.58 25.46 L 12.54 25.46 C 12.68 25.46 12.79 25.57 12.79 25.7 C 12.79 25.84 12.68 25.95 12.54 25.95 Z"/>
        <path transform="translate(-10.91 -18.25)" d="M 25.35 32.63 L 22.61 32.63 C 22.48 32.63 22.37 32.74 22.37 32.87 C 22.37 33.01 22.48 33.12 22.61 33.12 L 25.34 33.12 C 25.48 33.12 25.59 33.01 25.59 32.87 C 25.59 32.74 25.48 32.63 25.34 32.63 Z"/>
        <path transform="translate(-12.08 -16.49)" d="M 26.52 29.71 L 24.55 29.71 C 24.41 29.71 24.3 29.82 24.3 29.96 C 24.3 30.09 24.41 30.2 24.55 30.2 L 26.52 30.2 C 26.65 30.2 26.76 30.09 26.76 29.96 C 26.76 29.82 26.65 29.71 26.52 29.71 Z"/>
      </g>
    </g>

    <!-- Authentic Trydos "GreenBigTruck" icon from public/icons/GreenBigTruck.svg -->
    <g id="opj-ic-truck-body">
      <g transform="translate(0.248 6.009)">
        <path d="M5.543,18.747H1.8l-.149.756a.928.928,0,0,0,.917,1.1H5.407a3.391,3.391,0,0,1-.05-.619,4.11,4.11,0,0,1,.186-1.239ZM18.776,6.085a.9.9,0,0,0-.719-.347H5.048a.942.942,0,0,0-.917.756l-.087.483H6.906A2.163,2.163,0,0,1,8.009,11a2.153,2.153,0,0,1,0,3.717,2.236,2.236,0,0,1,.88,1,4.336,4.336,0,0,1,5.142,4.262,3.391,3.391,0,0,1-.05.619h1.289a.928.928,0,0,0,.9-.731L18.961,6.865a.9.9,0,0,0-.186-.781Z" transform="translate(0.837 -5.738)" fill="#bef4cd" stroke="#1d1d1d" stroke-width="0.328"/>
        <path d="M17.664,8.2H15.013a.943.943,0,0,0-.917.731L12.114,18.22a.932.932,0,0,0,.9,1.127h.669a3.391,3.391,0,0,1-.05-.619,4.336,4.336,0,0,1,8.673,0,2.132,2.132,0,0,1-.025.4.81.81,0,0,0,.31-.508l.929-4.336a1.084,1.084,0,0,0,.025-.2A5.89,5.89,0,0,0,17.664,8.2Z" transform="translate(6.186 -4.48)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
        <path d="M17.032,19.31a3.1,3.1,0,1,1,3.1-3.1A3.1,3.1,0,0,1,17.032,19.31Z" transform="translate(7.128 -1.964)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
        <path d="M8.015,19.31a3.1,3.1,0,1,1,3.1-3.1,3.1,3.1,0,0,1-3.1,3.1Z" transform="translate(2.516 -1.964)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
      </g>
    </g>
    <g id="opj-ic-truck-lines">
      <g transform="translate(0.248 6.009)">
        <path d="M6.9,9.235H2.569a.929.929,0,0,1,0-1.858H6.9a.929.929,0,0,1,0,1.858Z" transform="translate(0.839 -4.899)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
        <path d="M7.324,11.695H1.749a.929.929,0,0,1,0-1.858H7.324a.929.929,0,1,1,0,1.858Z" transform="translate(0.419 -3.641)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
        <path d="M7.743,14.154H.929a.929.929,0,0,1,0-1.858H7.743a.929.929,0,0,1,0,1.858Z" transform="translate(0 -2.383)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
      </g>
    </g>

    <!-- Authentic Trydos "delivery_location" map icon (OrderExpectedDeliveryCard.tsx) -->
    <g id="opj-ic-map" fill="currentColor">
      <g transform="translate(1.569 -0.04)">
        <g transform="translate(0 5.333)">
          <path d="M14.014,16.2H7.307a.242.242,0,0,1-.242-.259.252.252,0,0,1,.242-.259h6.707a2.283,2.283,0,0,0,2.343-2.343,2.278,2.278,0,0,0-.582-1.438,2.317,2.317,0,0,0-1.762-.76H9.8a2.747,2.747,0,1,1,0-5.495h3.442a.242.242,0,0,1,.242.259.23.23,0,0,1-.259.226H9.8a2.255,2.255,0,0,0,0,4.509h4.218a2.781,2.781,0,0,1,2.844,2.683A2.816,2.816,0,0,1,14.014,16.2Z" transform="translate(-1.602 -5.645)"/>
          <g transform="translate(0 7.014)">
            <ellipse cx="1.083" cy="1.099" rx="1.083" ry="1.099" transform="translate(1.891 1.875)"/>
            <path d="M4.587,12.645a2.939,2.939,0,0,0-2.974,2.893,2.738,2.738,0,0,0,.566,1.681v.016L4.36,20.241a.253.253,0,0,0,.194.1.23.23,0,0,0,.194-.1l2.214-3.006a.016.016,0,0,1,.016-.016,2.807,2.807,0,0,0,.566-1.681A2.915,2.915,0,0,0,4.587,12.645Zm0,4.558A1.6,1.6,0,1,1,6.17,15.6,1.59,1.59,0,0,1,4.587,17.2Z" transform="translate(-1.613 -12.645)"/>
          </g>
        </g>
        <g transform="translate(10.731)">
          <path d="M12.323,3.636h6.723L15.684.323Z" transform="translate(-12.323 -0.323)"/>
          <path d="M12.984,8.4H14.5v-2a.252.252,0,0,1,.242-.259H16.62a.242.242,0,0,1,.242.259v2h1.519V4.129h-5.4Z" transform="translate(-12.321 -0.315)"/>
        </g>
      </g>
    </g>

    <!-- Authentic Trydos "shopping-3" doorstep handoff icon (OrderStatusIcon.tsx) -->
    <g id="opj-ic-doorstep" fill="currentColor">
      <g transform="translate(0 1.873)">
        <path d="M6.02,7.35a.387.387,0,0,1-.033-.773l.078-.008V5.38H5.156v.763h-.52V5.38H3.727V6.389a1.891,1.891,0,0,0,.21.012,2.358,2.358,0,0,0,.343-.027.387.387,0,1,1,.114.766,3.12,3.12,0,0,1-.457.035h0c-.07,0-.139,0-.206-.008v.552H6.065v-.37H6.02Z" transform="translate(-0.621 -0.897)"/>
        <path d="M15.973,0H10.71V10.1h-.554v.232H11.4V9.953h-.483V.207h4.208l-3.467.884v10.16l.018,0,3.588-.915h1.428V10.1h-.72ZM12.041,5.908l.311-.1v1.97l-.311.1Z" transform="translate(-1.693)"/>
        <ellipse cx="0.871" cy="0.871" rx="0.871" ry="0.871" transform="matrix(0.974, -0.227, 0.227, 0.974, 5.553, 2.026)"/>
        <path d="M9.316,10.989a4.862,4.862,0,0,1-.3-1.7A5.255,5.255,0,0,1,9.192,7.95c.015-.057.03-.109.045-.157a.729.729,0,0,0,.548-.648A4.276,4.276,0,0,0,9.564,5a.886.886,0,0,0-1-.664c-.33.082-.476.543-.365.929.016.079.033.164.051.252a1.264,1.264,0,0,0,.1-.446.389.389,0,0,1,.373-.4h.014a.386.386,0,0,1,.387.373s0,.012,0,.026a2.037,2.037,0,0,1-.712,1.5,3.271,3.271,0,0,1-.01.682,6.071,6.071,0,0,0-.352,2.049,5.829,5.829,0,0,0,.361,2.031.484.484,0,0,0,.907-.336Z" transform="translate(-1.341 -0.719)"/>
        <path d="M8.721,5.152c0-.01,0-.02,0-.023a.31.31,0,0,0-.619.02h0v0a1.345,1.345,0,0,1-.218.684,1.386,1.386,0,0,1-.488.449,2.434,2.434,0,0,1-1.005.278.31.31,0,0,0,.026.618h.026A3.048,3.048,0,0,0,7.7,6.823a1.973,1.973,0,0,0,.879-.991,1.9,1.9,0,0,0,.141-.681Z" transform="translate(-1.018 -0.805)"/>
      </g>
    </g>

    <!-- Authentic Trydos "OrderSuccess" emblem (public/icons/OrderSuccess.svg) -->
    <g id="opj-ic-success">
      <g transform="translate(-25 -25)">
        <path d="M147.855,136.634a2.156,2.156,0,0,0-3.049,0l-9.257,9.256-3.866-3.865a2.156,2.156,0,0,0-3.049,3.049l5.391,5.391a2.155,2.155,0,0,0,3.049,0l10.782-10.782A2.156,2.156,0,0,0,147.855,136.634Z" transform="translate(-111.7 -118.4)" fill="#26C13F"/>
        <path d="M47.917,22.917A2.084,2.084,0,0,0,45.833,25a20.832,20.832,0,1,1-6.049-14.679,2.083,2.083,0,1,0,2.956-2.935A25,25,0,1,0,50,25,2.084,2.084,0,0,0,47.917,22.917Z" fill="#26C13F"/>
      </g>
    </g>
  </defs>

  <!-- Elastic Tensioned Wire Track (colors from start x=8 & deflects crisply under loads) -->
  <path class="p-railBg" d="M 8 112 L 872 112" fill="none" stroke="#E8E8E8" stroke-width="4" stroke-linecap="round"/>
  <path class="p-railFill" d="M 8 112 L 8 112" fill="none" stroke="#1D1D1D" stroke-width="4" stroke-linecap="round"/>

  <!-- Station Dots (riding on the flexing track) & Shockwave Pulse Ring -->
  <circle class="p-ring" cx="100" cy="112" r="6" fill="none" stroke-width="1.6" opacity="0"/>
  <circle class="p-dot" cx="100" cy="112" r="5.5" fill="#1D1D1D"/>
  <circle class="p-dot" cx="300" cy="112" r="5.5" fill="#1D1D1D"/>
  <circle class="p-dot" cx="500" cy="112" r="5.5" fill="#1D1D1D"/>
  <circle class="p-dot" cx="700" cy="112" r="5.5" fill="#1D1D1D"/>

  <!-- Active Drag Scrubber Ring (hidden unless actively scrubbing) -->
  <g class="p-thumb" opacity="0">
    <circle r="7" fill="#FFFFFF" stroke="#402CDD" stroke-width="2"/>
    <circle r="2.2" fill="#402CDD"/>
  </g>

  <!-- Authentic Trydos Packing Bench & Secondary Spring-Bouncing Boxes (x = 300) -->
  <g class="p-bench" opacity="0">
    <g class="p-benchDesk" transform="scale(2.06)">
      <use href="#opj-ic-bench-desk" style="color:#D8D8D8"/>
    </g>
    <g class="p-benchShelves" transform="scale(2.06)">
      <use href="#opj-ic-bench-shelves" style="color:#C8C8C8"/>
    </g>
    <g class="p-benchBoxL" transform="scale(2.06)">
      <use href="#opj-ic-bench-boxL" style="color:#D2D2D2"/>
    </g>
    <g class="p-benchBoxR" transform="scale(2.06)">
      <use href="#opj-ic-bench-boxR" style="color:#D2D2D2"/>
    </g>
  </g>

  <!-- Authentic Trydos Map Destination & Radar Rings (x = 848) -->
  <line class="p-drop" x1="848" y1="62" x2="848" y2="106" stroke="#CFCFCF" stroke-width="1.2" stroke-dasharray="2 3"/>
  <circle class="p-radar1" cx="848" cy="36" r="8" fill="none" stroke="#26C13F" stroke-width="1.5" opacity="0"/>
  <circle class="p-radar2" cx="848" cy="36" r="8" fill="none" stroke="#26C13F" stroke-width="1.2" opacity="0"/>
  <g class="p-pinWrap">
    <g transform="translate(838.98 16.98) scale(2)">
      <use href="#opj-ic-map" style="color:#9A9A9A"/>
      <use class="p-pinGreen" href="#opj-ic-map" style="color:#26C13F" opacity="0"/>
    </g>
  </g>

  <!-- Actor 5: Authentic Trydos Doorstep Customer Receiver (at x = 840) -->
  <g class="p-doorstep" opacity="0">
    <use href="#opj-ic-doorstep" style="color:#26C13F"/>
  </g>

  <!-- Animated Checkmarks for Every Stage (Buy, Preparing, Shipped, Delivered) -->
  <g class="p-check" transform="translate(100 112) scale(0)">
    <circle class="p-checkBg" r="8.2" fill="#1D1D1D"/>
    <path class="p-checkPath" d="M-3.6 0.2 L-0.9 2.9 L3.8 -2.6" fill="none" stroke="#fff" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
  </g>
  <g class="p-check" transform="translate(300 112) scale(0)">
    <circle class="p-checkBg" r="8.2" fill="#1D1D1D"/>
    <path class="p-checkPath" d="M-3.6 0.2 L-0.9 2.9 L3.8 -2.6" fill="none" stroke="#fff" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
  </g>
  <g class="p-check" transform="translate(500 112) scale(0)">
    <circle class="p-checkBg" r="8.2" fill="#1D1D1D"/>
    <path class="p-checkPath" d="M-3.6 0.2 L-0.9 2.9 L3.8 -2.6" fill="none" stroke="#fff" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
  </g>
  <g class="p-check" transform="translate(700 112) scale(0)">
    <circle class="p-checkBg" r="8.5" fill="#26C13F"/>
    <path class="p-checkPath" d="M-3.8 0.2 L-1 3 L4 -2.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
  </g>

  <!-- Dynamic Ground Contact Shadows & Heat Glow -->
  <ellipse class="p-shProd" cx="100" cy="110.5" rx="8" ry="1.7" fill="#1D1D1D" opacity="0"/>
  <ellipse class="p-shCatcher" cx="152" cy="111" rx="10" ry="1.7" fill="#1D1D1D" opacity="0"/>
  <ellipse class="p-shPacker" cx="324" cy="111" rx="10" ry="1.7" fill="#1D1D1D" opacity="0"/>
  <ellipse class="p-shUnloader" cx="682" cy="111" rx="9.5" ry="1.7" fill="#1D1D1D" opacity="0"/>
  <ellipse class="p-shCourier" cx="774" cy="111" rx="9" ry="1.7" fill="#1D1D1D" opacity="0"/>
  <ellipse class="p-shRock" cx="500" cy="111" rx="11" ry="1.7" fill="#1D1D1D" opacity="0"/>
  <ellipse class="p-heat" cx="500" cy="111" rx="18" ry="2.6" fill="#FF9A3D" opacity="0"/>

  <!-- Deterministic Particle Pools (rocket exhaust, blast dust, confetti) -->
  <g class="p-particles"></g>

  <!-- Actor 6: Trydos Rocket (exact rocket-2 icon + thrust-vectored gimbal plume + spring struts) -->
  <g class="p-rocket" opacity="0">
    <g class="p-rframe">
      <g fill="none" stroke="#402CDD" stroke-linecap="round" stroke-linejoin="round">
        <path class="p-legL" stroke-width="1.7"/>
        <path class="p-legR" stroke-width="1.7"/>
      </g>
      <circle class="p-glow" cx="0" cy="10" r="6" fill="#FFB347" opacity="0" style="filter:blur(2px)"/>
      <g class="p-rocketInner">
        <g class="p-flame">
          <path d="M0,-1.9 C3.2,-1.9 7,-0.7 11,0 C7,0.7 3.2,1.9 0,1.9 Z" fill="#FF7A1A"/>
          <path d="M0,-1.1 C2.2,-1.1 4.4,-0.35 6.8,0 C4.4,0.35 2.2,1.1 0,1.1 Z" fill="#FFD84A"/>
        </g>
        <use href="#opj-ic-rocket" style="color:#402CDD"/>
        <use class="p-rlines" href="#opj-ic-rocket-lines" style="color:#402CDD"/>
      </g>
    </g>
  </g>

  <!-- Actor 1: Catcher & Warehouse Runner (2-Bone IK, Indigo #402CDD) -->
  <g class="p-cBack" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-cArmF" stroke="#8C80F0" stroke-width="2.6"/>
    <path class="p-cLegF" stroke="#8C80F0" stroke-width="3.6"/>
    <path class="p-cShoeF" stroke="#5A4BC4" stroke-width="3.0"/>
    <path class="p-cTorso" stroke="#402CDD" stroke-width="7.4"/>
    <path class="p-cLegN" stroke="#402CDD" stroke-width="3.8"/>
    <path class="p-cShoeN" stroke="#24178F" stroke-width="3.2"/>
    <path class="p-cHair" fill="#24178F" stroke="none"/>
    <circle class="p-cHead" r="4.4" fill="#402CDD" stroke="none"/>
  </g>

  <!-- Actor 2: Master Packer at work bench (2-Bone IK, Deep Violet #2E1FA8 + cap) -->
  <g class="p-pBack" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-pArmF" stroke="#7E72DB" stroke-width="2.6"/>
    <path class="p-pLegF" stroke="#7E72DB" stroke-width="3.6"/>
    <path class="p-pShoeF" stroke="#483BA8" stroke-width="3.0"/>
    <path class="p-pTorso" stroke="#2E1FA8" stroke-width="7.4"/>
    <path class="p-pLegN" stroke="#2E1FA8" stroke-width="3.8"/>
    <path class="p-pShoeN" stroke="#1D136E" stroke-width="3.2"/>
    <circle class="p-pHead" r="4.4" fill="#2E1FA8" stroke="none"/>
    <path class="p-pCap" fill="#1D1D1D" stroke="none"/>
  </g>

  <!-- Actor 3: Rocket Recovery & Unload Specialist (2-Bone IK, Crew Slate + Amber Hardhat) -->
  <g class="p-uBack" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-uArmF" stroke="#7E829E" stroke-width="2.6"/>
    <path class="p-uLegF" stroke="#7E829E" stroke-width="3.6"/>
    <path class="p-uShoeF" stroke="#1D1D1D" stroke-width="3.0"/>
    <path class="p-uTorso" stroke="#2B2D42" stroke-width="7.4"/>
    <path class="p-uLegN" stroke="#2B2D42" stroke-width="3.8"/>
    <path class="p-uShoeN" stroke="#14141F" stroke-width="3.2"/>
    <circle class="p-uHead" r="4.4" fill="#2B2D42" stroke="none"/>
    <path class="p-uCap" fill="#FF7A1A" stroke="none"/>
  </g>

  <!-- Actor 4: Express Final-Mile Courier (2-Bone IK, Emerald Green #26C13F) -->
  <g class="p-eBack" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-eArmF" stroke="#79E28C" stroke-width="2.5"/>
    <path class="p-eLegF" stroke="#79E28C" stroke-width="3.5"/>
    <path class="p-eShoeF" stroke="#188C2C" stroke-width="2.9"/>
    <path class="p-eTorso" stroke="#26C13F" stroke-width="7.2"/>
    <path class="p-eLegN" stroke="#26C13F" stroke-width="3.7"/>
    <path class="p-eShoeN" stroke="#146E22" stroke-width="3.1"/>
    <circle class="p-eHead" r="4.3" fill="#26C13F" stroke="none"/>
    <path class="p-eCap" fill="#1D1D1D" stroke="none"/>
  </g>

  <!-- Hero Object: Product Card -> Authentic Sealed Carton (productBox) + Ribbons + Seal -->
  <g class="p-prod" opacity="0">
    <g class="p-prodInner">
      <rect x="-11" y="-13.5" width="22" height="27" rx="4.5" fill="#fff"/>
      <g clip-path="url(#opj-tileClip)">
        <svg x="-11" y="-13.5" width="22" height="27" viewBox="258 195 230 282" preserveAspectRatio="xMidYMid slice">
          <use href="#opj-prodImg"/>
        </svg>
        <rect class="p-boxTint" x="-11" y="-13.5" width="22" height="27" rx="4.5" fill="#FFDBAA" opacity="0"/>
        <use class="p-boxGlyph" href="#opj-ic-box" transform="scale(1.22)" style="color:#402CDD" opacity="0"/>
        <rect class="p-ribV" x="-1.5" y="-13.5" width="3" height="27" fill="#402CDD" opacity="0"/>
        <rect class="p-ribH" x="-11" y="2.5" width="22" height="3" fill="#402CDD" opacity="0"/>
      </g>
      <rect x="-11" y="-13.5" width="22" height="27" rx="4.5" fill="none" stroke="#1D1D1D" stroke-opacity=".14" stroke-width=".9"/>
      <g class="p-bow" transform="translate(0 4) scale(0)">
        <circle cx="-2.6" cy="0" r="2.2" fill="none" stroke="#402CDD" stroke-width="1.4"/>
        <circle cx="2.6" cy="0" r="2.2" fill="none" stroke="#402CDD" stroke-width="1.4"/>
        <circle r="1.3" fill="#402CDD"/>
      </g>
      <g class="p-badge" transform="translate(9.5 -11.5) scale(0)">
        <circle r="4.6" fill="#26C13F" stroke="#fff" stroke-width="1.2"/>
        <path d="M-2.1 0.1 L-0.6 1.6 L2.2 -1.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>
  </g>

  <!-- Near Arms (drawn in front of the carried parcel so grips hug it naturally) -->
  <g class="p-cFront" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-cArmN" stroke="#402CDD" stroke-width="2.8"/>
  </g>
  <g class="p-pFront" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-pArmN" stroke="#2E1FA8" stroke-width="2.8"/>
  </g>
  <g class="p-uFront" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-uArmN" stroke="#2B2D42" stroke-width="2.8"/>
  </g>
  <g class="p-eFront" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="p-eArmN" stroke="#26C13F" stroke-width="2.7"/>
  </g>

  <!-- Delivered Doorstep Celebration: Trydos Green Bag + Authentic OrderSuccess Emblem + Map Love Emojis -->
  <g class="p-deliveredBag" opacity="0">
    <path d="M-4.5 -14 C-4.5 -19.5 4.5 -19.5 4.5 -14" fill="none" stroke="#1D1D1D" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M-8.5 -13.5 L8.5 -13.5 L10 -1.8 C10.3 -0.4 9.5 0 8 0 L-8 0 C-9.5 0 -10.3 -0.4 -10 -1.8 Z" fill="#6FE86A" stroke="#1D1D1D" stroke-width="1.2" stroke-linejoin="round"/>
    <use href="#opj-ic-success" transform="translate(0 -6.8) scale(0.2)"/>
  </g>
  <g class="p-emojis"></g>

  <!-- Authentic Trydos "claim" Buy Cursor & Trampoline Ripple -->
  <g class="p-cursor" opacity="0"><use href="#opj-ic-buy" style="color:#402CDD"/></g>
  <circle class="p-tap" cx="100" cy="96" r="2" fill="none" stroke="#402CDD" stroke-width="1.3" opacity="0"/>

  <!-- Interactive Rail Scrubber Hit Band -->
  <rect class="p-scrubHit" x="0" y="84" width="880" height="50" fill="transparent" style="cursor:ew-resize"/>
`;
