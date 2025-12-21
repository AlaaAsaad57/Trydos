import { RoundPrice } from "utils/server";
import { OfferPrice } from "./OfferPrice";

export const RenderPrice = ({
  is_redeem,
  flash_price,
  offer_price,
  price,
  currency,
}) => {
  if (is_redeem) {
    return (
      <OfferPrice
        is_redeem={true}
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
      is_redeem={false}
      price={RoundPrice({
        num: flash_price ?? offer_price ?? price,
        rate: currency?.exchange_rate,
        points: currency?.decimal_digits,
      })}
    />
  );
};
