import React from "react";
import ThreePointsIcon from "public/svg/threepoints";
import ActiveThreePointsIcon from "public/svg/activethreepoints";

function ThreePoints({ active }) {
  return <>{active ? <ActiveThreePointsIcon /> : <ThreePointsIcon />}</>;
}

export default ThreePoints;
