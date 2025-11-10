import * as React from 'react';

const Krd = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 120" {...props}>
  <rect width="180" height="40" y="80" fill="#ed1c24"/>
  <rect width="180" height="40" y="40" fill="#fff"/>
  <rect width="180" height="40" y="0" fill="#00a650"/>
  <g transform="translate(90 60) scale(0.8)">
    <circle r="12" fill="#fcd116"/>
    <g fill="#fcd116">
      <g id="ray">
        <path d="M0,-12 L2,-20 L-2,-20 Z"/>
      </g>
      <use href="#ray" transform="rotate(15)"/>
      <use href="#ray" transform="rotate(30)"/>
      <use href="#ray" transform="rotate(45)"/>
      <use href="#ray" transform="rotate(60)"/>
      <use href="#ray" transform="rotate(75)"/>
      <use href="#ray" transform="rotate(90)"/>
      <use href="#ray" transform="rotate(105)"/>
      <use href="#ray" transform="rotate(120)"/>
      <use href="#ray" transform="rotate(135)"/>
      <use href="#ray" transform="rotate(150)"/>
      <use href="#ray" transform="rotate(165)"/>
      <use href="#ray" transform="rotate(180)"/>
      <use href="#ray" transform="rotate(195)"/>
      <use href="#ray" transform="rotate(210)"/>
      <use href="#ray" transform="rotate(225)"/>
      <use href="#ray" transform="rotate(240)"/>
      <use href="#ray" transform="rotate(255)"/>
      <use href="#ray" transform="rotate(270)"/>
      <use href="#ray" transform="rotate(285)"/>
      <use href="#ray" transform="rotate(300)"/>
      <use href="#ray" transform="rotate(315)"/>
      <use href="#ray" transform="rotate(330)"/>
      <use href="#ray" transform="rotate(345)"/>
    </g>
  </g>
</svg>
);

export default Krd;
