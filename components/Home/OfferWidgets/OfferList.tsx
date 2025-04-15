// "use client";

// import NormalWidget from "./NormalWidget";

// import { Boutique } from "models/offer";
// import { useEffect, useState } from "react";
// import { LogData } from "store/homepage/actions";
// import InfinteScroll from "components/global/InfinteScroll";
// interface OfferListProps {
//   quick: boolean;
//   boutiques: Boutique[];
//   response?: any;
//   offsetVariable?: string;
// }
// function OfferList({
//   boutiques,
//   response,
//   offsetVariable,
// }: OfferListProps) {

//   const [nextBoutieues, setBoutiques] = useState([]);

//   return (
//     <div
//       className={`offers-list pb-[184px]`}
//       data-cy="boutiques"
//     >
//       {/* {quick ? (
//         <QuickOfferWidjet onClick={() => {}} offer={{ photos: [1] }} />
//       ) : (
//         offers.map((offer: number, Index) =>
//           Index !== 2 ? (
//             <NormalWidget
//               onClick={() => {}}
//               myKey={Index}
//               key={Index}
//               offer={{
//                 photos: Index === 0 || Index === 1 ? [1] : [1, 1],
//               }}
//             />
//           ) : (
//             <NormalWidget
//               myKey={Index}
//               onClick={() => {}}
//               key={Index}
//               offer={{
//                 photos: [1, 1, 1].filter((item, index) => index <= Index),
//               }}
//             />
//           )
//         )
//       )} */}

//       {[...boutiques, ...nextBoutieues].map((boutique: Boutique, index) => {
//         if (boutique.banners?.length > 0)
//           return (
//             <NormalWidget

//               myKey={index}
//               key={index}
//               boutique={boutique}
//             />
//           );
//       })}

//     </div>
//   );
// }

// export default OfferList;
