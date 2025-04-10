import React from "react";
import { RoundPrice, translateFunction } from "utils/functions";
import WalletIcon from "assets/svg/cart/WalletIcon.svg";
import CreditIcon from "assets/svg/cart/CreditIcon.svg";
import CryptoIcon from "assets/svg/cart/CryptoIcon.svg";

interface OrderInvoiceCardProps {
  amount: number;
  payments: {
    value: string;
    label: string;
  };
}

const OrderInvoiceCard: React.FC<OrderInvoiceCardProps> = ({
  amount,
  payments,
}) => {
  // Format the amount to currency
  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat("en-US", {
  //     style: "currency",
  //     currency: "USD",
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2,
  //   }).format(value);
  // };

  return (
    <div className="bg-[#F4F4F4] relative ml-[8px] w-1/3 min-h-[74px] h-auto rounded-[15px] py-[8px] px-[12px] flex-col">
      <PaymentsIcon payments={payments} />
      <svg
        id="_20x20"
        data-name="20x20"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="20"
        height="20"
        viewBox="0 0 15 15"
      >
        <defs>
          <clipPath id="clip-path865">
            <rect
              id="Rectangle_4612"
              data-name="Rectangle 4612"
              width="15"
              height="15"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Mask_Group_701"
          data-name="Mask Group 701"
          clip-path="url(#clip-path865)"
        >
          <g id="_x31_8_Invoice" transform="translate(1.812 0.001)">
            <g id="Group_13612" data-name="Group 13612">
              <g id="Group_13611" data-name="Group 13611">
                <path
                  id="Path_22986"
                  data-name="Path 22986"
                  d="M13.259,8.38a.177.177,0,0,0,.169-.183V4.9a1.3,1.3,0,0,0-.333-.869C13.079,4.014,9.931.613,9.916.6h0a1.108,1.108,0,0,0-.8-.357H3.191A1.185,1.185,0,0,0,2.053,1.467V14.014a1.186,1.186,0,0,0,1.137,1.226h9.1a1.185,1.185,0,0,0,1.137-1.226V9.835a.17.17,0,1,0-.339,0v4.179a.832.832,0,0,1-.8.86h-9.1a.832.832,0,0,1-.8-.86V1.467a.831.831,0,0,1,.8-.86h5.92a.749.749,0,0,1,.233.038V3.424A1.185,1.185,0,0,0,10.48,4.65h2.573a.865.865,0,0,1,.037.25V8.2a.177.177,0,0,0,.169.183Z"
                  transform="translate(-2.053 -0.241)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22987"
                  data-name="Path 22987"
                  d="M11.868,10H4.752a.244.244,0,0,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                  transform="translate(-2.053 -2.741)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22988"
                  data-name="Path 22988"
                  d="M11.868,12.4H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                  transform="translate(-2.053 -3.358)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22989"
                  data-name="Path 22989"
                  d="M11.868,14.812H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                  transform="translate(-2.053 -3.975)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22990"
                  data-name="Path 22990"
                  d="M11.868,17.221H4.752a.244.244,0,1,0,0,.488h7.116a.244.244,0,0,0,0-.488Z"
                  transform="translate(-2.053 -5.241)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22991"
                  data-name="Path 22991"
                  d="M15.73,10H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                  transform="translate(-7.053 -2.741)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22992"
                  data-name="Path 22992"
                  d="M15.73,12.374H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                  transform="translate(-7.053 -3.35)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22993"
                  data-name="Path 22993"
                  d="M15.73,14.751H14.31a.244.244,0,1,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                  transform="translate(-7.053 -3.959)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22994"
                  data-name="Path 22994"
                  d="M15.73,17.129H14.31a.244.244,0,0,0,0,.488h1.42a.244.244,0,1,0,0-.488Z"
                  transform="translate(-7.053 -5.241)"
                  fill="#8d8d8d"
                />
                <path
                  id="Path_22995"
                  data-name="Path 22995"
                  d="M5.949,6.829a.8.8,0,0,1-.8-.8.244.244,0,0,0-.488,0A1.286,1.286,0,0,0,5.705,7.293V7.74a.244.244,0,1,0,.488,0V7.293a1.284,1.284,0,0,0-.244-2.545.8.8,0,1,1,.8-.8.244.244,0,1,0,.488,0A1.286,1.286,0,0,0,6.193,2.691V2.244a.244.244,0,1,0-.488,0v.447a1.284,1.284,0,0,0,.244,2.545.8.8,0,1,1,0,1.593Z"
                  transform="translate(-2.999 -0.241)"
                  fill="#8d8d8d"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
      <span className="text-[#8D8D8D] regular text-[10px] mt-[5px]">
        {translateFunction("Order Invoice")}
      </span>
      <span className="text-[#1D1D1D] text-[12px] regular mt-[3px]">
        {RoundPrice({ num: amount })}
      </span>
    </div>
  );
};

export default OrderInvoiceCard;
const PaymentsIcon = ({
  payments,
}: {
  payments: { value: string; label: string };
}) => {
  const showPaymentIcon = (payment: { value: string; label: string }) => {
    switch (payment.value) {
      case "cash_on_delivery":
        return <WalletIcon />;
      case "trydos_wallet":
        return <WalletIcon />;
      case "crypto":
        return <CryptoIcon />;
      default:
        return null;
    }
  };
  return (
    <div className="absolute top-[8px] right-[12px]">
      {showPaymentIcon(payments)}
    </div>
  );
};
