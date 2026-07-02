import { RoundPrice } from "utils/server";
import { OfferPrice } from "./OfferPrice";

export const RenderPrice = ({
  luckActive,
  flash_price,
  offer_price,
  price,
  currency,
}) => {
  return (
    <OfferPrice
      luckActive={luckActive}
      price={RoundPrice({
        num: flash_price ?? offer_price ?? price,
        rate: currency?.exchange_rate,
        points: currency?.decimal_digits,
      })}
    />
  );
};
