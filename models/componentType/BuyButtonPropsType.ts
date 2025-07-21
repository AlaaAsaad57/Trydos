export interface BuyButtonPropsType {
  buy: Function;
  shouldShowRedeem: boolean;
  redeem_price: number;
  currency: any;
  id: string | number;
  onExpire: () => void;
}
