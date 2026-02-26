import { RoundPrice } from "utils/server";
import { OfferPrice } from "./OfferPrice";

export const RenderPrice = ({
  is_luck,
  flash_price,
  offer_price,
  price,
  currency,
}) => {
  if (is_luck) {
    return (
      <OfferPrice
        is_luck={true}
        price={RoundPrice({
          num: flash_price ?? offer_price ?? price,
          rate: currency?.exchange_rate,
          points: currency?.decimal_digits,
        })}
      />
    );
  }
  return (
    <OfferPrice
      is_luck={false}
      price={RoundPrice({
        num: flash_price ?? offer_price ?? price,
        rate: currency?.exchange_rate,
        points: currency?.decimal_digits,
      })}
    />
  );
};
