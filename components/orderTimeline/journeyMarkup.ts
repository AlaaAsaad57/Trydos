/*
  The SVG inside the order journey stage. Static markup we own (no user data),
  so OrderJourney.tsx puts it in with dangerouslySetInnerHTML.

  The icons are the real Trydos ones:
    oj-ic-buy          OrderStatusIcon.tsx, "pending" (claim)
    oj-ic-rocket       OrderStatusIcon.tsx, group "rocket-2"
    oj-ic-truck-*      public/icons/GreenBigTruck.svg (shell and wheels split, so the wheels turn)
    oj-ic-map          OrderExpectedDeliveryCard.tsx, "delivery_location"
  The employee is drawn with joints (legs, arms) so journeyMotion.ts can make him walk.
  Every moving part has an "x-<name>" class. journeyMotion.ts finds the parts by that class.
*/
export const JOURNEY_SVG = `
  <defs>
  <image id="oj-prodImg" width="642" height="933" href="/assets/demo/listing/product-tshirt.webp"/>
  <clipPath id="oj-tileClip" clipPathUnits="userSpaceOnUse"><rect x="-11" y="-13.5" width="22" height="27" rx="4.5"/></clipPath>
  <g id="oj-ic-buy" fill="currentColor"><path fill-rule="evenodd" transform="translate(-0.388 -0.389)" d="M1.1,9.718a.217.217,0,0,1-.418.112A7.477,7.477,0,1,1,5.563,15a.217.217,0,1,1,.136-.411A7.043,7.043,0,1,0,1.1,9.718Zm9.3-4.011a.615.615,0,0,1,.852.888L7.635,10.069a.615.615,0,0,1-.848,0l-2.225-2.1a.615.615,0,1,1,.844-.9l1.8,1.7Zm-5.14,5.018a.217.217,0,1,1-.309-.3l.309-.314a.217.217,0,0,1,.309.3Zm-1.3-.474a.217.217,0,0,1-.419-.109l.11-.426a.217.217,0,0,1,.419.109Zm1.6,1.876a.217.217,0,1,1-.115-.417l.424-.117a.217.217,0,1,1,.115.417Zm-3.055,2L1.345,15.288a.155.155,0,0,1-.219,0L.433,14.6a.155.155,0,0,1,0-.219L1.59,13.219l-.734-.4a.155.155,0,0,1,.021-.281l3.34-1.229a.155.155,0,0,1,.2.2l-1.229,3.34a.155.155,0,0,1-.281.021Z"/></g>
  <g id="oj-ic-rocket" fill="currentColor">
  <path d="M2.431,6.932l2.119.16c.223-.55.466-1.1.726-1.623.283-.579.617-1.263,1-1.924A7.412,7.412,0,0,0,2.431,6.932Z"/>
  <path d="M7.741,10.231,7.9,12.339a7.519,7.519,0,0,0,3.417-3.8c-.3.168-.629.342-1.006.528-.178.1-.342.179-.493.251-.255.122-.514.241-.791.362-.423.2-.857.381-1.29.553Z"/>
  <path d="M14.871.026a12.282,12.282,0,0,0-3.661.3l3.355,3.315a10.862,10.862,0,0,0,.3-1.906c.027-.394.019-1.561.01-1.709Z"/>
  <circle cx="0.907" cy="0.907" r="0.907" transform="translate(9.359 3.668)"/>
  <path d="M10.64.484a6.433,6.433,0,0,0-2.715,1.64A14.746,14.746,0,0,0,5.738,5.692,23.981,23.981,0,0,0,4.375,9.1L5.7,10.405A24.614,24.614,0,0,0,9.148,9.058,14.137,14.137,0,0,0,12.759,6.9,6.34,6.34,0,0,0,14.4,4.2Zm-.374,5.6a1.512,1.512,0,1,1,1.512-1.512A1.512,1.512,0,0,1,10.266,6.087Z"/>
  </g>
  <g id="oj-ic-rocket-lines" fill="currentColor">
  <path d="M.531,14.847a.258.258,0,0,1-.185-.433l3.518-3.622a.258.258,0,0,1,.363-.006.255.255,0,0,1,.006.361L.716,14.769a.257.257,0,0,1-.185.078Z"/>
  <path d="M3.007,15a.258.258,0,0,1-.192-.425l2.28-2.552A.258.258,0,0,1,5.458,12a.255.255,0,0,1,.021.361L3.2,14.914A.257.257,0,0,1,3.007,15Z"/>
  <path d="M.376,12.554a.258.258,0,0,1-.192-.425l2.28-2.552a.258.258,0,0,1,.363-.021.255.255,0,0,1,.021.361L.568,12.468a.257.257,0,0,1-.192.086Z"/>
  </g>
  <g id="oj-ic-truck-body"><g transform="translate(0.248 6.009)">
  <path d="M5.543,18.747H1.8l-.149.756a.928.928,0,0,0,.917,1.1H5.407a3.391,3.391,0,0,1-.05-.619,4.11,4.11,0,0,1,.186-1.239ZM18.776,6.085a.9.9,0,0,0-.719-.347H5.048a.942.942,0,0,0-.917.756l-.087.483H6.906A2.163,2.163,0,0,1,8.009,11a2.153,2.153,0,0,1,0,3.717,2.236,2.236,0,0,1,.88,1,4.336,4.336,0,0,1,5.142,4.262,3.391,3.391,0,0,1-.05.619h1.289a.928.928,0,0,0,.9-.731L18.961,6.865a.9.9,0,0,0-.186-.781Z" transform="translate(0.837 -5.738)" fill="#bef4cd" stroke="#1d1d1d" stroke-width="0.328"/>
  <path d="M17.664,8.2H15.013a.943.943,0,0,0-.917.731L12.114,18.22a.932.932,0,0,0,.9,1.127h.669a3.391,3.391,0,0,1-.05-.619,4.336,4.336,0,0,1,8.673,0,2.132,2.132,0,0,1-.025.4.81.81,0,0,0,.31-.508l.929-4.336a1.084,1.084,0,0,0,.025-.2A5.89,5.89,0,0,0,17.664,8.2Z" transform="translate(6.186 -4.48)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  <path d="M17.032,19.31a3.1,3.1,0,1,1,3.1-3.1A3.1,3.1,0,0,1,17.032,19.31Z" transform="translate(7.128 -1.964)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  <path d="M8.015,19.31a3.1,3.1,0,1,1,3.1-3.1,3.1,3.1,0,0,1-3.1,3.1Z" transform="translate(2.516 -1.964)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  </g></g>
  <g id="oj-ic-truck-lines"><g transform="translate(0.248 6.009)">
  <path d="M6.9,9.235H2.569a.929.929,0,0,1,0-1.858H6.9a.929.929,0,0,1,0,1.858Z" transform="translate(0.839 -4.899)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  <path d="M7.324,11.695H1.749a.929.929,0,0,1,0-1.858H7.324a.929.929,0,1,1,0,1.858Z" transform="translate(0.419 -3.641)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  <path d="M7.743,14.154H.929a.929.929,0,0,1,0-1.858H7.743a.929.929,0,0,1,0,1.858Z" transform="translate(0 -2.383)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  </g></g>
  <g id="oj-ic-map" fill="currentColor"><g transform="translate(1.569 -0.04)">
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
  </g></g>
  <g id="oj-ic-truck-shell"><g transform="translate(0.248 6.009)">
  <path d="M5.543,18.747H1.8l-.149.756a.928.928,0,0,0,.917,1.1H5.407a3.391,3.391,0,0,1-.05-.619,4.11,4.11,0,0,1,.186-1.239ZM18.776,6.085a.9.9,0,0,0-.719-.347H5.048a.942.942,0,0,0-.917.756l-.087.483H6.906A2.163,2.163,0,0,1,8.009,11a2.153,2.153,0,0,1,0,3.717,2.236,2.236,0,0,1,.88,1,4.336,4.336,0,0,1,5.142,4.262,3.391,3.391,0,0,1-.05.619h1.289a.928.928,0,0,0,.9-.731L18.961,6.865a.9.9,0,0,0-.186-.781Z" transform="translate(0.837 -5.738)" fill="#bef4cd" stroke="#1d1d1d" stroke-width="0.328"/>
  <path d="M17.664,8.2H15.013a.943.943,0,0,0-.917.731L12.114,18.22a.932.932,0,0,0,.9,1.127h.669a3.391,3.391,0,0,1-.05-.619,4.336,4.336,0,0,1,8.673,0,2.132,2.132,0,0,1-.025.4.81.81,0,0,0,.31-.508l.929-4.336a1.084,1.084,0,0,0,.025-.2A5.89,5.89,0,0,0,17.664,8.2Z" transform="translate(6.186 -4.48)" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  </g></g>
  <g id="oj-ic-wheel">
  <circle r="3.1" fill="#e8ffed" stroke="#1d1d1d" stroke-width="0.328"/>
  <circle r="1.05" fill="#1d1d1d"/>
  <circle cy="-2.05" r="0.36" fill="#1d1d1d"/><circle cy="2.05" r="0.36" fill="#1d1d1d"/>
  <circle cx="-2.05" r="0.36" fill="#1d1d1d"/><circle cx="2.05" r="0.36" fill="#1d1d1d"/>
  </g>
  </defs>
    <line x1="8" y1="110" x2="872" y2="110" stroke="#E8E8E8" stroke-width="4" stroke-linecap="round"/>
    <line class="x-fill" x1="100" y1="110" x2="100" y2="110" stroke="#1D1D1D" stroke-width="4" stroke-linecap="round" opacity="0"/>
    <circle class="x-ring" cx="100" cy="110" r="6" fill="none" stroke-width="1.5" opacity="0"/>
    <circle class="x-dot" cx="100" cy="110" r="5.5" fill="#1D1D1D"/>
    <circle class="x-dot" cx="300" cy="110" r="5.5" fill="#1D1D1D"/>
    <circle class="x-dot" cx="500" cy="110" r="5.5" fill="#1D1D1D"/>
    <circle class="x-dot" cx="700" cy="110" r="5.5" fill="#1D1D1D"/>
    <line class="x-drop" x1="845" y1="62" x2="845" y2="104" stroke="#CFCFCF" stroke-width="1.2" stroke-dasharray="2 3"/>
    <g class="x-pinWrap">
      <g transform="translate(835.98 19.98) scale(2)">
        <use href="#oj-ic-map" style="color:#9A9A9A"/>
        <use class="x-pinGreen" href="#oj-ic-map" style="color:#26C13F" opacity="0"/>
      </g>
    </g>
    <circle class="x-burst" cx="867" cy="30" r="4" fill="none" stroke="#26C13F" stroke-width="1.5" opacity="0"/>
    <g class="x-check" transform="translate(700 110) scale(0)">
      <circle r="8.5" fill="#26C13F"/>
      <path class="x-checkPath" d="M-3.8 0.2 L-1 3 L4 -2.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
    </g>
    <ellipse class="x-shProd" cx="100" cy="109" rx="8" ry="1.7" fill="#1D1D1D" opacity="0"/>
    <ellipse class="x-shWork" cx="282" cy="109.5" rx="10" ry="1.7" fill="#1D1D1D" opacity="0"/>
    <ellipse class="x-shRock" cx="500" cy="109.5" rx="11" ry="1.7" fill="#1D1D1D" opacity="0"/>
    <ellipse class="x-shTruck" cx="845" cy="109.5" rx="20" ry="1.9" fill="#1D1D1D" opacity="0"/>
    <ellipse class="x-heat" cx="500" cy="109.6" rx="16" ry="2.4" fill="#FF9A3D" opacity="0"/>
    <g class="x-smoke"></g>
    <g class="x-truck" opacity="0">
      <g class="x-tbody">
        <g transform="translate(-15 -23.4)">
          <g class="x-tlines"><use href="#oj-ic-truck-lines"/></g>
          <use href="#oj-ic-truck-shell"/>
          <rect class="x-brake" x="2.1" y="14.6" width="1.3" height="2" rx=".4" fill="#FF3B30" opacity="0"/>
          <rect class="x-rev" x="2.1" y="17" width="1.3" height="1.5" rx=".4" fill="#FFFFFF" stroke="#cfcfcf" stroke-width=".2" opacity="0"/>
        </g>
      </g>
      <g transform="translate(-4.22 -3.14)"><g class="x-wh"><use href="#oj-ic-wheel"/></g></g>
      <g transform="translate(9.4 -3.14)"><g class="x-wh"><use href="#oj-ic-wheel"/></g></g>
    </g>
    <g class="x-rocket" opacity="0">
      <g class="x-rframe">
        <g fill="none" stroke="#402CDD" stroke-linecap="round" stroke-linejoin="round">
          <path class="x-legL" stroke-width="1.7"/>
          <path class="x-legR" stroke-width="1.7"/>
        </g>
        <circle class="x-glow" cx="0" cy="10" r="6" fill="#FFB347" opacity="0" style="filter:blur(2px)"/>
        <g class="x-rocketInner">
          <g class="x-flame">
            <path d="M0,-1.8 C3,-1.8 6.5,-0.6 10,0 C6.5,0.6 3,1.8 0,1.8 Z" fill="#FF7A1A"/>
            <path d="M0,-1 C2,-1 4,-0.3 6,0 C4,0.3 2,1 0,1 Z" fill="#FFD84A"/>
          </g>
          <use href="#oj-ic-rocket" style="color:#402CDD"/>
          <use class="x-rlines" href="#oj-ic-rocket-lines" style="color:#402CDD"/>
        </g>
      </g>
    </g>
    <g class="x-man" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path class="x-armF" stroke="#8C80F0" stroke-width="2.7"/>
      <path class="x-legF" stroke="#8C80F0" stroke-width="3.7"/>
      <path class="x-shoeF" stroke="#5A4BC4" stroke-width="3.1"/>
      <path class="x-torso" stroke="#402CDD" stroke-width="7.6"/>
      <path class="x-legN" stroke="#402CDD" stroke-width="3.9"/>
      <path class="x-shoeN" stroke="#24178F" stroke-width="3.3"/>
      <path class="x-hair" fill="#24178F" stroke="none"/>
      <circle class="x-head" r="4.5" fill="#402CDD" stroke="none"/>
    </g>
    <g class="x-prod" opacity="0"><g class="x-prodInner">
      <rect x="-11" y="-13.5" width="22" height="27" rx="4.5" fill="#fff"/>
      <g clip-path="url(#oj-tileClip)">
        <svg x="-11" y="-13.5" width="22" height="27" viewBox="258 195 230 282" preserveAspectRatio="xMidYMid slice"><use href="#oj-prodImg"/></svg>
        <rect class="x-ribV" x="-1.5" y="-13.5" width="3" height="27" fill="#402CDD" opacity="0"/>
        <rect class="x-ribH" x="-11" y="2.5" width="22" height="3" fill="#402CDD" opacity="0"/>
      </g>
      <rect x="-11" y="-13.5" width="22" height="27" rx="4.5" fill="none" stroke="#1D1D1D" stroke-opacity=".12" stroke-width=".8"/>
      <g class="x-bow" transform="translate(0 4) scale(0)">
        <circle cx="-2.6" cy="0" r="2.2" fill="none" stroke="#402CDD" stroke-width="1.4"/>
        <circle cx="2.6" cy="0" r="2.2" fill="none" stroke="#402CDD" stroke-width="1.4"/>
        <circle r="1.3" fill="#402CDD"/>
      </g>
      <g class="x-badge" transform="translate(9.5 -11.5) scale(0)">
        <circle r="4.6" fill="#26C13F" stroke="#fff" stroke-width="1.2"/>
        <path d="M-2.1 0.1 L-0.6 1.6 L2.2 -1.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>
    </g>
    <g class="x-manFront" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path class="x-armN" stroke="#402CDD" stroke-width="2.9"/>
    </g>
    <g class="x-cursor" opacity="0"><use href="#oj-ic-buy" style="color:#402CDD"/></g>
    <circle class="x-tap" cx="106" cy="96" r="2" fill="none" stroke="#402CDD" stroke-width="1.2" opacity="0"/>
`;
