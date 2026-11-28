import {
  ORDER_PHOTO_PAJAMA,
  ORDER_PHOTO_SHIRT,
} from "../../DemoApp/demoOrders";

/**
 * Static SVG markup for the Order Timeline physics stage (`viewBox="0 0 406 54"`,
 * `overflow="visible"` so the soaring rocket gravity-turn arc & smoke trail
 * fly cleanly above the card top edge without altering the card border).
 *
 * Uses 100% NEW XD ICONS from `Home Page – 60..66`, rigged with real
 * articulated joints, spinning wheels, independent inertia boxes, and
 * per-product photo-parcels where EACH product image IS the delivered box:
 *
 *   1. `x-cart*`    NEW XD `orderCartPurple` — articulated 2-bone IK striding
 *                   pusher + leaning torso + rolling cart + 2 spinning wheels +
 *                   base box carrying the active product photo-parcel on top.
 *   2. `x-work*`    NEW XD `orderWorkTrack` — packing table + boxes + worker
 *                   with articulated ponytail, nodding head, dual working arms,
 *                   and squashing/folding garment.
 *   3. `x-carry*`   NEW XD `orderCarryPurple` — exact XD rounded head & chunky
 *                   torso rigged with 2-bone IK foot-planted legs holding ONE
 *                   product photo-parcel right in their bent arms.
 *   4. `x-rocket*`  NEW XD `orderRocketUpPurple`/`Down` — exact XD rocket body
 *                   & 3 speed lines + retractable landing legs + gimballed flame
 *                   + circular porthole showing the product riding inside!
 *   5. `x-truck*`   NEW XD `orderTruckTrack` — exact `#BECDF4` cargo, `#E8E8FF`
 *                   cab & spinning wheels, `#E8FFED` speed lines, brake & reverse
 *                   lamps, catching & carrying each product photo-parcel on its roof.
 *   6. `x-parcel0`  Product 0 (Blue Pajama) & `x-parcel1` (Pink Shirt) — each
 *      `x-parcel1`  product photo IS the physical delivered box moving along its
 *                   own independent journey so product photos NEVER hide labels!
 */
export const ORDER_TIMELINE_SVG = `
<defs>
  <clipPath id="ot-boxClip" clipPathUnits="userSpaceOnUse">
    <rect x="-5" y="-6.5" width="10" height="13" rx="2"/>
  </clipPath>
  <clipPath id="ot-portClip" clipPathUnits="userSpaceOnUse">
    <circle cx="13.525" cy="6.101" r="1.95"/>
  </clipPath>
  <linearGradient id="ot-cyanSheen" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
    <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.72"/>
    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>

  <!-- Exact XD Rocket body (orderRocketUpPurple, local 0..19.7 x 0..20, pointing +45 deg) -->
  <g id="ot-ic-rocket" fill="#4A31E7">
    <g transform="translate(0.648 1.180)"><path d="M 2.43 8.06 L 5.25 8.27 C 5.55 7.54 5.88 6.81 6.22 6.11 C 6.6 5.34 7.04 4.42 7.56 3.54 C 4.53 4.86 2.98 6.85 2.43 8.06 Z"/></g>
    <g transform="translate(2.415 2.842)"><path d="M 7.74 10.79 L 7.96 13.6 C 9.15 13.07 11.15 11.54 12.51 8.54 C 12.11 8.76 11.67 8.99 11.17 9.24 C 10.93 9.37 10.72 9.48 10.51 9.58 C 10.17 9.74 9.83 9.9 9.46 10.06 C 8.9 10.32 8.32 10.57 7.74 10.79 Z"/></g>
    <g transform="translate(3.570 0)"><path d="M 16.09 0.03 C 14.79 -0.04 13 -0.02 11.21 0.43 L 15.68 4.85 C 15.9 3.99 16.02 3.12 16.08 2.31 C 16.11 1.79 16.1 0.23 16.09 0.03 Z"/></g>
    <g transform="translate(12.313 4.889)"><path d="M0 1.21 A1.21 1.21 0 1 0 2.42 1.21 A1.21 1.21 0 1 0 0 1.21 Z"/></g>
    <g transform="translate(1.295 0.161)"><path d="M 12.73 0.48 C 11.41 0.91 10.13 1.59 9.11 2.67 C 7.88 3.97 6.94 5.88 6.19 7.43 C 5.46 8.91 4.85 10.44 4.38 11.96 L 6.14 13.71 C 7.69 13.24 9.23 12.63 10.74 11.91 C 12.39 11.13 14.27 10.24 15.55 9.03 C 16.63 8.02 17.31 6.75 17.74 5.44 L 12.73 0.48 Z M 12.23 7.95 C 11.11 7.95 10.21 7.05 10.21 5.94 C 10.21 4.82 11.11 3.92 12.23 3.92 C 13.34 3.92 14.24 4.82 14.24 5.94 C 14.24 7.05 13.34 7.95 12.23 7.95 Z"/></g>
  </g>
  <g id="ot-ic-rocket-lines" fill="#4A31E7">
    <g transform="translate(-0.069 3.566)"><path d="M 0.62 16.22 C 0.32 16.22 0.16 15.86 0.37 15.65 L 5.06 10.82 C 5.19 10.68 5.41 10.68 5.54 10.81 C 5.68 10.94 5.68 11.16 5.55 11.29 L 0.86 16.12 C 0.79 16.19 0.71 16.22 0.62 16.22 Z"/></g>
    <g transform="translate(0.755 3.973)"><path d="M 3.09 16.02 C 2.8 16.02 2.64 15.67 2.84 15.45 L 5.87 12.05 C 6 11.91 6.22 11.9 6.36 12.02 C 6.5 12.15 6.51 12.36 6.39 12.5 L 3.35 15.91 C 3.28 15.98 3.19 16.02 3.09 16.02 Z"/></g>
    <g transform="translate(-0.121 3.159)"><path d="M 0.46 13.57 C 0.17 13.57 0.01 13.22 0.2 13.01 L 3.24 9.61 C 3.37 9.46 3.59 9.45 3.73 9.58 C 3.87 9.7 3.88 9.92 3.76 10.06 L 0.72 13.46 C 0.65 13.53 0.56 13.57 0.46 13.57 Z"/></g>
  </g>

  <!-- Exact XD Truck shell & speed lines (orderTruckTrack: #BECDF4 cargo, #E8E8FF cab, #E8FFED lines, 0.328px #1D1D1D stroke) -->
  <g id="ot-ic-truck-shell">
    <g transform="translate(-0.041 -5.738)">
      <path d="M 4.16 14.13 L 1.74 14.13 L 1.65 14.61 C 1.61 14.79 1.66 14.97 1.77 15.11 C 1.89 15.25 2.06 15.33 2.24 15.32 L 4.07 15.32 C 4.05 15.19 4.03 15.06 4.04 14.93 C 4.03 14.65 4.08 14.38 4.16 14.13 Z M 12.69 5.96 C 12.58 5.82 12.41 5.74 12.22 5.74 L 3.84 5.74 C 3.55 5.74 3.3 5.94 3.25 6.23 L 3.19 6.54 L 5.03 6.54 C 5.66 6.54 6.22 6.96 6.38 7.56 C 6.55 8.17 6.29 8.81 5.75 9.13 C 6.17 9.38 6.43 9.84 6.43 10.33 C 6.43 10.82 6.17 11.28 5.75 11.53 C 6 11.68 6.19 11.91 6.31 12.18 C 7.13 12.02 7.98 12.24 8.62 12.77 C 9.26 13.3 9.63 14.09 9.63 14.93 C 9.63 15.06 9.62 15.19 9.6 15.32 L 10.43 15.32 C 10.71 15.32 10.95 15.13 11.01 14.85 L 12.81 6.46 C 12.85 6.29 12.81 6.1 12.69 5.96 Z" fill="#BECDF4" stroke="#1D1D1D" stroke-width="0.328"/>
    </g>
    <g transform="translate(-0.306 -5.800)">
      <path d="M 15.69 8.2 L 13.98 8.2 C 13.69 8.2 13.45 8.39 13.38 8.67 L 12.11 14.66 C 12.07 14.84 12.11 15.02 12.22 15.16 C 12.34 15.3 12.51 15.39 12.69 15.39 L 13.12 15.39 C 13.1 15.26 13.09 15.12 13.09 14.99 C 13.09 13.44 14.34 12.19 15.89 12.19 C 17.43 12.19 18.68 13.44 18.68 14.99 C 18.68 15.07 18.68 15.16 18.67 15.24 C 18.77 15.16 18.84 15.05 18.87 14.92 L 19.46 12.12 C 19.47 12.08 19.48 12.03 19.48 11.99 C 19.48 9.9 17.78 8.2 15.69 8.2 Z" fill="#E8E8FF" stroke="#1D1D1D" stroke-width="0.328"/>
    </g>
  </g>
  <g id="ot-ic-truck-lines">
    <g transform="translate(-0.042 -5.779)">
      <path d="M 5.03 8.58 L 2.24 8.58 C 1.91 8.58 1.64 8.31 1.64 7.98 C 1.64 7.65 1.91 7.38 2.24 7.38 L 5.03 7.38 C 5.37 7.38 5.63 7.65 5.63 7.98 C 5.63 8.31 5.37 8.58 5.03 8.58 Z" fill="#E8FFED" stroke="#1D1D1D" stroke-width="0.328"/>
    </g>
    <g transform="translate(-0.021 -5.841)">
      <path d="M 5.01 11.03 L 1.42 11.03 C 1.09 11.03 0.82 10.77 0.82 10.44 C 0.82 10.1 1.09 9.84 1.42 9.84 L 5.01 9.84 C 5.34 9.84 5.61 10.1 5.61 10.44 C 5.61 10.77 5.34 11.03 5.01 11.03 Z" fill="#E8FFED" stroke="#1D1D1D" stroke-width="0.328"/>
    </g>
    <g transform="translate(0 -5.904)">
      <path d="M 4.99 13.49 L 0.6 13.49 C 0.27 13.49 0 13.23 0 12.89 C 0 12.56 0.27 12.3 0.6 12.3 L 4.99 12.3 C 5.32 12.3 5.59 12.56 5.59 12.89 C 5.59 13.23 5.32 13.49 4.99 13.49 Z" fill="#E8FFED" stroke="#1D1D1D" stroke-width="0.328"/>
    </g>
  </g>
  <g id="ot-ic-wheel">
    <circle r="2.0" fill="#E8E8FF" stroke="#1D1D1D" stroke-width="0.328"/>
    <g class="x-whHub" opacity="0">
      <circle r="0.52" fill="#1D1D1D" opacity="0.55"/>
      <circle cy="-1.22" r="0.24" fill="#1D1D1D" opacity="0.55"/>
      <circle cy="1.22" r="0.24" fill="#1D1D1D" opacity="0.55"/>
      <circle cx="-1.22" r="0.24" fill="#1D1D1D" opacity="0.55"/>
      <circle cx="1.22" r="0.24" fill="#1D1D1D" opacity="0.55"/>
    </g>
  </g>

  <!-- Cart wheel matching orderCartPurple -->
  <g id="ot-ic-cartWheel">
    <circle r="1.22" fill="#4A31E7"/>
    <circle r="0.44" fill="#FCFCFC"/>
    <line x1="-0.95" y1="0" x2="0.95" y2="0" stroke="#FCFCFC" stroke-width="0.28" opacity="0.8"/>
  </g>
</defs>

<!-- Base rail: x 19..394, y 35, h 4, rx 2 -->
<rect class="x-rail" x="19" y="35" width="375" height="4" rx="2" fill="#DFDFDF"/>

<!-- Primary progress bar (purple or delivered ink): x 12.., y 35, h 4, rx 2 -->
<rect class="x-fillMain" x="12" y="35" width="84" height="4" rx="2" fill="#4A31E7"/>
<rect class="x-fillMainStroke" x="12.25" y="35.25" width="239.5" height="3.5" rx="1.75" fill="none" stroke="#4A31E7" stroke-width="0.5" opacity="0"/>

<!-- Secondary progress bar (green #31E770 or cyan #38E0FF with 0.5px purple border): x 247.. -->
<rect class="x-fillSub" x="247" y="35" width="0" height="4" rx="2" fill="#31E770" opacity="0"/>
<rect class="x-fillSubStroke" x="247.25" y="35.25" width="0" height="3.5" rx="1.75" fill="none" stroke="#4A31E7" stroke-width="0.5" opacity="0"/>
<rect class="x-cyanShimmer" x="247" y="35" width="24" height="4" rx="2" fill="url(#ot-cyanSheen)" opacity="0"/>

<!-- Expanding pulse rings on milestone dots -->
<circle class="x-ring" cx="57" cy="37" r="7" fill="none" stroke="#4A31E7" stroke-width="1.2" opacity="0"/>
<circle class="x-ring2" cx="207" cy="37" r="7" fill="none" stroke="#4A31E7" stroke-width="1.2" opacity="0"/>

<!-- Three XD milestone dots: r 7 at cx 57, 207, 349, cy 37 -->
<circle class="x-dot" cx="57" cy="37" r="7" fill="#4A31E7"/>
<circle class="x-dot" cx="207" cy="37" r="7" fill="#B2B2B2"/>
<circle class="x-dot" cx="349" cy="37" r="7" fill="#DFDFDF"/>

<!-- Ground shadows & thruster heat reflection resting cleanly on track surface y=35.4 -->
<ellipse class="x-shCart" cx="46" cy="35.4" rx="9" ry="1.0" fill="#1D1D1D" opacity="0"/>
<ellipse class="x-shP0" cx="57" cy="35.4" rx="4.5" ry="0.9" fill="#1D1D1D" opacity="0"/>
<ellipse class="x-shP1" cx="57" cy="35.4" rx="4.5" ry="0.9" fill="#1D1D1D" opacity="0"/>
<ellipse class="x-shCarry" cx="140" cy="35.4" rx="5.5" ry="1.0" fill="#1D1D1D" opacity="0"/>
<ellipse class="x-shRock" cx="208" cy="35.4" rx="7.5" ry="1.1" fill="#1D1D1D" opacity="0"/>
<ellipse class="x-shTruck" cx="268" cy="35.4" rx="9.5" ry="1.0" fill="#1D1D1D" opacity="0"/>
<ellipse class="x-heat" cx="208" cy="35.4" rx="11" ry="1.6" fill="#FF9A3D" opacity="0"/>

<!-- Particle layer populated by collectTimelineParts() -->
<g class="x-smoke"></g>

<!-- =======================================================================
     1. NEW XD SUPPLIER CART (orderCartPurple):
        Rigged with 2-bone IK striding pusher + leaning torso + cart frame +
        2 spinning cart wheels + base box (the active product photo-parcel
        rides right on top of the cart!).
     ======================================================================= -->
<g class="x-cart" opacity="0">
  <g class="x-cartPusher" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="x-cartLegF" stroke="#7E6CF2" stroke-width="2.1"/>
    <path class="x-cartTorso" stroke="#4A31E7" stroke-width="3.6"/>
    <path class="x-cartLegN" stroke="#4A31E7" stroke-width="2.2"/>
    <circle class="x-cartHead" r="2.12" fill="#4A31E7" stroke="none"/>
    <path class="x-cartArm" stroke="#4A31E7" stroke-width="1.8"/>
  </g>
  <g class="x-cartRig">
    <g class="x-cartDeck" fill="#4A31E7">
      <!-- Bottom XD cart crate (exact orderCartPurple rounded rect 8.18 x 4.35) -->
      <g class="x-cartBox1">
        <rect x="0.8" y="-5.4" width="8.18" height="3.8" rx="0.9" fill="#4A31E7"/>
      </g>
      <!-- Cart handle & flatbed chassis (exact orderCartPurple L-frame) -->
      <path d="M -2.2 -9.5 L -0.4 -9.5 C 0 -9.5 0.3 -9.2 0.3 -8.8 L 0.3 -1.2 L 9.0 -1.2 C 9.4 -1.2 9.7 -0.9 9.7 -0.5 C 9.7 -0.1 9.4 0.2 9.0 0.2 L -0.4 0.2 C -0.8 0.2 -1.1 -0.1 -1.1 -0.5 L -1.1 -8.1 L -2.2 -8.1 C -2.6 -8.1 -2.9 -8.4 -2.9 -8.8 C -2.9 -9.2 -2.6 -9.5 -2.2 -9.5 Z"/>
    </g>
    <g transform="translate(1.8 -1.22)"><g class="x-cartWh"><use href="#ot-ic-cartWheel"/></g></g>
    <g transform="translate(7.4 -1.22)"><g class="x-cartWh"><use href="#ot-ic-cartWheel"/></g></g>
  </g>
</g>

<!-- =======================================================================
     2. NEW XD PACKING STATION (orderWorkTrack):
        Exact XD packing desk + taped boxes + worker with articulated ponytail,
        nodding head, dual working arms, and squashing/folding garment!
     ======================================================================= -->
<g class="x-work" opacity="0" fill="#4A31E7">
  <g class="x-workInner">
    <g class="x-workDesk">
      <g transform="translate(0.632 2.025)"><path d="M 4.74 10.13 L 4.74 17.11 L 7.99 17.11 L 7.99 12.92 L 13.82 12.92 L 13.82 17.11 L 14.25 17.11 L 14.25 12.92 L 19.24 12.92 L 19.24 10.13 L 4.74 10.13 Z"/></g>
      <g transform="translate(1.623 1.841)"><path d="M 12.17 8.75 L 16.14 8.75 L 16.14 9.94 L 12.17 9.94 L 12.17 8.75 Z"/></g>
      <g class="x-workTopBox">
        <g transform="translate(1.656 1.672)"><path d="M 12.42 7.48 L 16.39 7.48 L 16.39 8.68 L 12.42 8.68 L 12.42 7.48 Z"/></g>
      </g>
      <g transform="translate(1.052 2.390)"><path d="M 13.09 12.87 L 11.09 12.87 L 11.09 14.95 L 10.86 14.79 L 10.66 14.95 L 10.47 14.79 L 10.25 14.95 L 10.03 14.79 L 9.89 14.95 L 9.89 12.87 L 7.89 12.87 L 7.89 17.2 L 13.09 17.2 L 13.09 12.87 Z"/></g>
      <g transform="translate(1.788 2.390)"><path d="M 13.41 17.2 L 18.61 17.2 L 18.61 12.87 L 16.61 12.87 L 16.61 14.95 L 16.38 14.79 L 16.18 14.95 L 15.99 14.79 L 15.77 14.95 L 15.55 14.79 L 15.41 14.95 L 15.41 12.87 L 13.41 12.87 L 13.41 17.2 Z"/></g>
    </g>
    <g class="x-workGarment">
      <g transform="translate(0.761 1.472)"><path d="M 7.66 5.98 L 6.27 6.52 L 5.71 9.25 L 6.01 9.31 L 6.39 7.48 L 6.39 10.31 L 11.6 10.31 L 11.6 7.48 L 11.98 9.31 L 12.28 9.25 L 11.6 5.98 L 11.6 5.98 L 11.6 5.98 L 7.66 5.98 Z"/></g>
    </g>
    <g class="x-workTorso">
      <g class="x-workFarArm">
        <g transform="translate(0.850 1.185)"><path d="M 6.38 4.83 L 6.79 5.1 L 7.19 4.95 C 7.27 4.92 7.35 4.9 7.44 4.9 C 7.72 4.9 7.98 5.08 8.08 5.34 C 8.15 5.53 8.13 5.74 8.04 5.91 L 8.23 6.04 L 10.33 6.04 L 10.36 5.99 L 7.03 3.83 L 6.38 4.83 Z"/></g>
      </g>
      <g transform="translate(0.125 1.090)"><path d="M 2.26 17.5 C 2.22 17.93 2.54 18.31 2.97 18.35 C 2.99 18.35 3.02 18.35 3.04 18.35 C 3.44 18.35 3.78 18.05 3.82 17.64 L 4.21 13.07 C 4.21 13.07 4.21 13.07 4.21 13.07 C 4.21 13.04 4.21 13.01 4.21 12.98 C 4.21 12.97 4.21 12.97 4.21 12.96 C 4.21 12.94 4.21 12.91 4.2 12.89 C 4.2 12.88 4.2 12.88 4.2 12.87 L 3.63 9.52 C 3.57 8.92 3.51 7.92 3.82 6.57 L 2.47 5.14 C 2.34 5 2.27 4.83 2.28 4.64 C 2.29 4.46 2.36 4.29 2.5 4.16 C 2.62 4.04 2.79 3.98 2.97 3.98 C 3.16 3.98 3.34 4.06 3.47 4.19 L 4.74 5.55 L 4.98 5.74 C 5.08 5.81 5.19 5.85 5.3 5.85 C 5.39 5.85 5.48 5.83 5.57 5.78 L 6.86 4.98 L 6.85 4.98 L 7.7 3.68 L 8.58 4.25 C 8.58 4.25 8.58 4.24 8.59 4.24 C 8.72 3.99 8.62 3.69 8.37 3.56 L 8.01 3.37 C 7.85 3.29 7.67 3.3 7.51 3.39 L 5.34 4.72 L 3.62 3.35 C 3.58 3.32 3.53 3.29 3.48 3.27 C 2.79 2.91 1.93 3.14 1.62 4.18 C 1.31 5.21 2.35 5.71 1.12 8.39 C 1.02 8.62 0.97 8.81 0.95 8.99 C 0.92 9.15 0.93 9.31 1 9.47 L 2.64 13.14 L 2.26 17.5 Z"/></g>
      <g class="x-workHair">
        <g transform="translate(0 0.811)"><path d="M 2.37 1.3 C 2.38 1.21 2.4 1.11 2.43 1.03 C 1.83 1.09 1.12 1.4 1.01 2.73 C 0.9 4.03 0.44 4.19 0.09 4.14 C -0.27 4.08 0.52 4.85 1.43 4.08 C 2.14 3.49 1.86 2 2.36 1.64 C 2.35 1.53 2.35 1.41 2.37 1.3 Z"/></g>
      </g>
      <g class="x-workHead">
        <g transform="matrix(0.793107 -0.609082 0.609082 0.793107 1.85789 2.0441)"><path d="M0 1.68 A1.68 1.68 0 1 0 3.36 1.68 A1.68 1.68 0 1 0 0 1.68 Z"/></g>
      </g>
      <g class="x-workArm">
        <g transform="translate(0.304 1.212)"><path d="M 8.16 6.03 C 8.43 5.93 8.56 5.64 8.46 5.38 C 8.35 5.12 8.06 4.99 7.8 5.09 L 5.01 6.16 L 3.16 4.19 C 2.96 3.99 2.64 3.98 2.44 4.17 C 2.24 4.36 2.23 4.69 2.42 4.89 L 4.51 7.11 C 4.6 7.21 4.74 7.27 4.88 7.27 C 4.94 7.27 5 7.26 5.06 7.23 L 8.16 6.03 Z"/></g>
      </g>
    </g>
  </g>
</g>

<!-- =======================================================================
     3. NEW XD BOX CARRIER (orderCarryPurple):
        Exact orderCarryPurple rounded head & chunky torso rigged with 2-bone
        IK foot-planted legs — holds ONE product photo-parcel at a time!
     ======================================================================= -->
<g class="x-carry" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path class="x-carryArmF" stroke="#7E6CF2" stroke-width="1.6"/>
  <path class="x-carryLegF" stroke="#7E6CF2" stroke-width="1.85"/>
  <path class="x-carryTorso" stroke="#4A31E7" stroke-width="4.4"/>
  <path class="x-carryLegN" stroke="#4A31E7" stroke-width="1.95"/>
  <circle class="x-carryHead" r="2.08" fill="#4A31E7" stroke="none"/>
</g>

<!-- =======================================================================
     4. NEW XD PERIWINKLE TRUCK (orderTruckTrack):
        Split body shell on spring suspension + 2 independently spinning
        wheels + animated #E8FFED speed lines + brake & reverse lamps!
     ======================================================================= -->
<g class="x-truck" opacity="0">
  <g class="x-tbody">
    <g transform="translate(-11.2 -11.186)">
      <g class="x-tlines"><use href="#ot-ic-truck-lines"/></g>
      <use href="#ot-ic-truck-shell"/>
      <rect class="x-brake" x="1.55" y="7.1" width="0.95" height="1.35" rx="0.3" fill="#FF3B30" opacity="0"/>
      <rect class="x-rev" x="1.55" y="8.55" width="0.95" height="0.95" rx="0.25" fill="#FFFFFF" stroke="#BDBDBD" stroke-width="0.2" opacity="0"/>
    </g>
  </g>
  <g transform="translate(-4.405 -2.0)"><g class="x-wh"><use href="#ot-ic-wheel"/></g></g>
  <g transform="translate(4.377 -2.0)"><g class="x-wh"><use href="#ot-ic-wheel"/></g></g>
</g>

<!-- =======================================================================
     5. NEW XD PURPLE ROCKET (orderRocketUpPurple / Down):
        Exact XD rocket + 3 speed lines + retractable legs + gimballed flame +
        circular porthole displaying whichever product is currently aboard!
     ======================================================================= -->
<g class="x-rocket" opacity="0">
  <g class="x-rframe">
    <g class="x-rlegs" fill="none" stroke="#4A31E7" stroke-linecap="round" stroke-linejoin="round" opacity="0">
      <path class="x-legL" stroke-width="1.05"/>
      <path class="x-legR" stroke-width="1.05"/>
    </g>
    <circle class="x-glow" cx="0" cy="6.5" r="4.2" fill="#FFB347" opacity="0" style="filter:blur(1.8px)"/>
    <g class="x-rocketInner">
      <g class="x-flame" opacity="0">
        <path d="M0,-1.45 C2.4,-1.45 5.4,-0.45 8.4,0 C5.4,0.45 2.4,1.45 0,1.45 Z" fill="#FF7A1A"/>
        <path d="M0,-0.8 C1.6,-0.8 3.3,-0.22 5.0,0 C3.3,0.22 1.6,0.8 0,0.8 Z" fill="#FFD84A"/>
      </g>
      <use href="#ot-ic-rocket"/>
      <use class="x-rlines" href="#ot-ic-rocket-lines"/>
      <!-- Live product photo riding inside the XD rocket's circular porthole! -->
      <g class="x-rocketPort" clip-path="url(#ot-portClip)" opacity="0">
        <circle cx="13.525" cy="6.101" r="1.95" fill="#FFFFFF"/>
        <image class="x-rPhoto0" x="11.4" y="3.9" width="4.3" height="4.5" href="${ORDER_PHOTO_PAJAMA}" preserveAspectRatio="xMidYMid slice" opacity="0"/>
        <image class="x-rPhoto1" x="11.4" y="3.9" width="4.3" height="4.5" href="${ORDER_PHOTO_SHIRT}" preserveAspectRatio="xMidYMid slice" opacity="0"/>
      </g>
    </g>
  </g>
</g>

<!-- =======================================================================
     6. PER-PRODUCT PHOTO-PARCELS (Product 0 = Blue Pajama, Product 1 = Pink Shirt):
        Each product's REAL photo IS the delivered box! Held by cart, packed on
        desk, carried individually by orderCarryPurple, tossed into Rocket,
        caught on Truck roof, and hopped onto Delivered — NEVER hiding labels!
     ======================================================================= -->
<g class="x-parcel0" opacity="0">
  <g class="x-parcel0Inner">
    <rect x="-5" y="-6.5" width="10" height="13" rx="2" fill="#FFFFFF"/>
    <g clip-path="url(#ot-boxClip)">
      <image x="-5" y="-6.5" width="10" height="13" href="${ORDER_PHOTO_PAJAMA}" preserveAspectRatio="xMidYMid slice"/>
    </g>
    <rect class="x-parcel0Border" x="-5" y="-6.5" width="10" height="13" rx="2" fill="none" stroke="#DFDFDF" stroke-width="0.5"/>
    <rect class="x-parcel0Frame" x="-5" y="-6.5" width="10" height="13" rx="2" fill="none" stroke="#4A31E7" stroke-width="0.9"/>
    <path class="x-parcel0Tape" d="M -1.5 -6.5 L -1.5 -4.6 L 0 -5.2 L 1.5 -4.6 L 1.5 -6.5 Z" fill="#4A31E7" opacity="0"/>
  </g>
</g>

<g class="x-parcel1" opacity="0">
  <g class="x-parcel1Inner">
    <rect x="-5" y="-6.5" width="10" height="13" rx="2" fill="#FFFFFF"/>
    <g clip-path="url(#ot-boxClip)">
      <image x="-5" y="-6.5" width="10" height="13" href="${ORDER_PHOTO_SHIRT}" preserveAspectRatio="xMidYMid slice"/>
    </g>
    <rect class="x-parcel1Frame" x="-5" y="-6.5" width="10" height="13" rx="2" fill="none" stroke="#4A31E7" stroke-width="0.9"/>
    <path class="x-parcel1Tape" d="M -1.5 -6.5 L -1.5 -4.6 L 0 -5.2 L 1.5 -4.6 L 1.5 -6.5 Z" fill="#4A31E7" opacity="0"/>
  </g>
</g>

<!-- Near carrying arm of orderCarryPurple (drawn in front of the single held photo-parcel!) -->
<g class="x-carryFront" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path class="x-carryArmN" stroke="#4A31E7" stroke-width="1.7"/>
</g>
`;
