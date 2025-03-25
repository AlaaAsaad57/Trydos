import React from "react";
import ThreePointsIcon from "public/svg/threepoints.svg";
import ActiveThreePointsIcon from "public/svg/activethreepoints.svg";

function ThreePoints({ active }) {
  return <>{active ? <ActiveThreePointsIcon /> : <ThreePointsIcon />}</>;
}

export default ThreePoints;
