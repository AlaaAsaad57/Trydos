import { useSelector } from "react-redux";
import NormalWidget from "./NormalWidget";
import ExtendedOfferWidget from "./ExtendedOfferWidget";
import QuickOfferWidjet from "./QuickOfferWidjet";
import { Boutique } from "models/offer";
interface OfferListProps {
  offers: number[];
  quick: boolean;
}
function OfferList({ offers, quick }: OfferListProps) {
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  const boutiques = useSelector((state: any) => state.homepage.boutiques);
  return (
    <div
      className={`offers-list ${
        (loginOpen && "hide-offers ") + (quick && " mt-5")
      }  w-full flex flex-col`}
    >
      {/* {quick ? (
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
            <NormalWidget
              myKey={Index}
              onClick={() => {}}
              key={Index}
              offer={{
                photos: [1, 1, 1].filter((item, index) => index <= Index),
              }}
            />
          )
        )
      )} */}
      {boutiques.map((boutique: Boutique) => {
        return (
          <NormalWidget
            onClick={() => {}}
            myKey={boutique.id}
            key={boutique.id}
            boutique={boutique}
          />
        );
      })}
    </div>
  );
}

export default OfferList;
