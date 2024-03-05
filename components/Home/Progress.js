import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import React from "react";

function CircularProgressbarComponent({ strokeWidth, value, text }) {
  return (
    <CircularProgressbar
      strokeWidth={strokeWidth}
      value={value}
      text={`${text} %`}
    />
  );
}

export default CircularProgressbarComponent;
