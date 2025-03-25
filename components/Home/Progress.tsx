import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

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
