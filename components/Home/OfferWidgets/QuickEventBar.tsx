// import QuickIcon from "public/svg/quickIcon.svg";
// import BarDescribtion from "../Bars/BarDescribtion";
// import StopWatch from "./StopWatch";
// import { translateFunction } from "utils/functions";
// import { useSelector } from "react-redux";
// import { useParams } from "next/navigation";

// function QuickEventBar() {
//   const language: string = useSelector(
//     (state: StateInterface) => state.homepage.language
//   );
//   let { lang } = useParams();
//   // @ts-ignore
//   let languageVariable = lang.split("-")[1];
//   const translate = (key, lang) => {
//     return translateFunction(key, languageVariable);
//   };
//   return (
//     <div className="quick-event-bar">
//       <BarDescribtion
//         name={translate("Quick Offer", language)}
//         desc={
//           translate("This Offer Is For Only", language) +
//           " 4 " +
//           translate("Hours", language) +
//           " , " +
//           translate("Remaining", language) +
//           " : "
//         }
//       />
//       <StopWatch
//         stopHour={new Date().setHours(
//           new Date().getHours() + 1,
//           new Date().getMinutes() + 2,
//           new Date().getSeconds() + 59
//         )}
//       />
//     </div>
//   );
// }

// export default QuickEventBar;
