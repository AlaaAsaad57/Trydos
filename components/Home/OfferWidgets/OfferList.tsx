import { useSelector } from "react-redux";
import NormalWidget from "./NormalWidget";
import dynamic from "next/dynamic";
const ExtendedOfferWidget = dynamic(() => import("./ExtendedOfferWidget"), {
  ssr: false,
});
const QuickOfferWidjet = dynamic(() => import("./QuickOfferWidjet"), {
  ssr: false,
});
interface OfferListProps {
  offers: number[];
  quick: boolean;
}
function OfferList({ offers, quick }: OfferListProps) {
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  return (
    <div
      className={`offers-list ${
        (loginOpen && "hide-offers ") + (quick && " mt-5")
      } `}
    >
      {quick ? (
        <QuickOfferWidjet onClick={() => {}} offer={{ photos: [1] }} />
      ) : (
        offers.map((offer: number, Index) =>
          Index !== 2 ? (
            <NormalWidget
              onClick={() => {}}
              myKey={Index}
              key={Index}
              offer={{
                photos: Index === 0 || Index === 1 ? [1] : [1, 1],
              }}
            />
          ) : (
            <ExtendedOfferWidget
              myKey={Index}
              onClick={() => {}}
              key={Index}
              offer={{
                photos: [1, 1, 1].filter((item, index) => index <= Index),
              }}
            />
          )
        )
      )}
    </div>
  );
}

export default OfferList;
