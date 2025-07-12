// import Image from "next/image";
// import { useEffect, memo } from "react";
// import ProductSlider from "./ProductSlider";
// import { getConfiguredImage } from "utils/functions";
// import { GetImageUrl } from "utils/tinyUtils";
// import { TopSliderPropsType } from "models/componentType/TopSliderPropsType";
// function TopSlider({
//   active,
//   images,
//   activeColor,
//   setActiveColor,
//   product_name,
// }: TopSliderPropsType) {
//   useEffect(() => {
//     if (typeof document !== "undefined") {
//       const slider: HTMLDivElement = document?.querySelector(".top-slider");
//       let isDown = false;
//       let startX;
//       let scrollLeft;

//       slider?.addEventListener("mousedown", (e: MouseEvent) => {
//         isDown = true;
//         slider.classList.add("active");
//         startX = e.pageX - slider?.offsetLeft;
//         scrollLeft = slider.scrollLeft;
//       });
//       slider?.addEventListener("mouseleave", () => {
//         isDown = false;
//         slider.classList.remove("active");
//       });
//       slider?.addEventListener("mouseup", () => {
//         isDown = false;
//         slider.classList.remove("active");
//       });
//       slider?.addEventListener("mousemove", (e) => {
//         if (!isDown) return;
//         e.preventDefault();
//         const x = e.pageX - slider.offsetLeft;
//         const walk = (x - startX) * 3; //scroll-fast
//         slider.scrollLeft = scrollLeft - walk;
//       });
//     }
//   }, []);

//   return (
//     <>
//       <div
//         className={`top-slider w-100 align-center flex ${
//           active && "active-sl"
//         }`}
//         style={{
//           position: active ? "static" : "absolute",
//           opacity: active ? "1" : "0",
//           zIndex: active ? "4" : "1",
//         }}
//       >
//         {images.map((img, i) => (
//           <div
//             className="top-slider w-100-element align-center flex relative"
//             key={i}
//             onClick={() => setActiveColor({ ...activeColor, index: i })}
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="30"
//               height="40"
//               viewBox="0 0 30 40"
//               className="absolute"
//               style={{ zIndex: "4" }}
//             >
//               <g
//                 id="Rectangle_4754"
//                 data-name="Rectangle 4754"
//                 fill="none"
//                 stroke="#fefefe"
//                 strokeWidth="0.5"
//               >
//                 <rect width="30" height="40" rx="8" stroke="none" />
//                 <rect
//                   x="0.25"
//                   y="0.25"
//                   width="29.5"
//                   height="39.5"
//                   rx="7.75"
//                   fill="none"
//                 />
//               </g>
//             </svg>
//             <Image
//               // @ts-ignore
//               src={getConfiguredImage({
//                 // @ts-ignore
//                 src: GetImageUrl(img.file_path),
//                 width: 400,
//                 height: 400,
//               })}
//               width={30}
//               height={40}
//               alt={product_name || "alt"}
//               loading="eager"
//               style={{
//                 objectPosition: "center top",
//                 objectFit: "cover",
//                 zIndex: "3",
//               }}
//             />
//           </div>
//         ))}
//       </div>
//       <div
//         className="product-photos overflow-visible w-100 justify-start align-center flex-col"
//         style={{
//           position: active ? "static" : "absolute",
//           opacity: active ? "1" : "0",
//           zIndex: active ? "4" : "1",
//         }}
//       >
//         <div
//           className={`product-container-slider ${"selected-color"} overflow-hidden`}
//         >
//           <ProductSlider
//             product_name={product_name}
//             setActiveColor={(e) => setActiveColor(e)}
//             activeColor={activeColor}
//           />
//         </div>
//       </div>
//     </>
//   );
// }

// export default memo(TopSlider);
