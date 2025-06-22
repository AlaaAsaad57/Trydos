import React from "react";
import {
  translateFunction,
  RoundPrice,
  getConfiguredImage,
} from "utils/functions";
import { OrderItem as OrderItemType } from "../../types/orders";

import { useParams } from "next/navigation";

import { useAppStore } from "store";
import OrderStatusIcon, {
  BagStatusIcon,
} from "components/settings/cards/OrderStatusIcon";
import Image from "node_modules/next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { OrderItemIdPropsType } from "models/componentType/OrderItemIdPropsType";
import { OrderItemTimePropsType } from "models/componentType/OrderItemTimePropsType";
import { OrderItemPropsType } from "models/componentType/OrderItemPropsType";

const OrderItem: React.FC<OrderItemPropsType> = ({ order, showDetails }) => {
  const { lang } = useParams();
  return (
    <div
      onClick={() => {
        showDetails();
      }}
      className="bg-[#f8f8f8] w-full cursor-pointer pt-[7px] pb-[12px] pl-[12px] pr-[10px] rounded-[15px] h-[200px] mt-[10px] flex-col"
    >
      <div className="flex-row w-full justify-between items-start">
        <OrderItemTime time={order.created_at} />
        <OrderItemId id={order.order_group_id.toString()} />
      </div>
      <div className="flex-row w-full justify-between items-start mt-[11px]">
        <OrderStatus status={order.order_group_status?.label} />
        <OrderInvoice
          invoice={{
            items: order.details.length,
            total: order.order_amount,
          }}
        />
      </div>
      <OrderProductSlider products={order?.details} />
    </div>
  );
};

export default OrderItem;
const OrderProductSlider = ({ products }) => {
  return (
    <div className="flex-row items-center pl-[12px] mt-[12px] whitespace-nowrap overflow-x-scroll overflow-y-hidden [&::-webkit-scrollbar]:hidden">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex-row cursor-pointer items-center relative w-[91px] h-[125px] ml-[5px]"
        >
          <Image
            className="w-[91px] h-[125px] object-cover   bg-white rounded-[15px]"
            src={getConfiguredImage({
              src: GetImageUrl(product?.image),
              width: 91,
              height: 125,
            })}
            alt={product.product_details.name}
            width={100}
            height={100}
            style={{
              border: "1px solid #FFFFFF7F",
            }}
          />
          <div
            className="absolute z-10 top-0 left-0 w-full h-full "
            style={{
              boxShadow: "inset 0px 3px 6px rgba(255, 255, 255, 0.5)",
            }}
          />
        </div>
      ))}
    </div>
  );
};
const OrderStatus = ({ status }: { status: string }) => {
  const { settings } = useAppStore();
  return (
    <div className="flex-row items-center">
      <BagStatusIcon status={status} />
      <span className="ml-[4px] text-[#1D1D1D] text-[12px] regular">
        {status}
      </span>
      <span className="ml-[7px]">
        <OrderStatusIcon status={status} />
      </span>
    </div>
  );
};

const OrderInvoice = ({
  invoice,
}: {
  invoice: { items: number; total: number };
}) => {
  const { currency } = useAppStore();
  return (
    <div className="flex-row items-center">
      <svg
        id="_20x20"
        data-name="20x20"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="15"
        height="15"
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
          clipPath="url(#clip-path865)"
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
      <div className="ml-[4px] regular flex-row items-center text-[#505050] text-[12px] regular">
        <span className="bold">{invoice.items}</span>
        <span className="ml-[2px]">{translateFunction("Items")}</span>
      </div>
      <div className="regular flex-row text-[12px] text-[#505050]">
        <span className="bold mx-[2px]">.</span>
        <span>{RoundPrice({ num: invoice.total })}</span>
        <span className="ml-[2px]">{currency?.symbol}</span>
      </div>
    </div>
  );
};
const OrderItemTime = ({ time }: OrderItemTimePropsType) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString + "Z");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const timeFormat = `${hours}:${minutes}:${seconds}`;

    if (date.toDateString() === today.toDateString()) {
      return `Today | ${timeFormat}`;
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday | ${timeFormat}`;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year} | ${timeFormat}`;
  };
  return (
    <div className="flex-row items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 15 15"
      >
        <g
          id="Group_13616"
          data-name="Group 13616"
          transform="translate(-30 -116)"
        >
          <g id="deadline" transform="translate(30.636 116)">
            <path
              id="Path_22971"
              data-name="Path 22971"
              d="M11.42,5.094a2,2,0,0,0,.311-1.324.778.778,0,0,0-.4-.5.7.7,0,0,0-.556-.052,1.415,1.415,0,0,0-.73.813,5.917,5.917,0,0,0-3.2-.77l-.083-.8c.1-.019.2-.04.319-.059A4.4,4.4,0,0,0,8.45,2a1.115,1.115,0,0,0,.216-.162.761.761,0,0,0,.243-.656A1.084,1.084,0,0,0,8.37.4,2.041,2.041,0,0,0,6.962.31L4.532.785C4.471.8,4.4.809,4.333.824,3.591.957,2.352,1.18,2.481,2.3a.873.873,0,0,0,.376.654,1.159,1.159,0,0,0,.644.169,2.565,2.565,0,0,0,.7-.112c.271-.081.544-.143.825-.2l.155.768a5.936,5.936,0,0,0-2.465,1.6.252.252,0,0,0-.081-.093A2.306,2.306,0,0,0,1.43,4.749a.766.766,0,0,0-.72.366.624.624,0,0,0,.1.661,2.052,2.052,0,0,0,.758.449c.1.045.2.093.288.136a5.986,5.986,0,0,0,5.231,8.87,6.157,6.157,0,0,0,1.194-.119A5.99,5.99,0,0,0,11.42,5.094ZM10.925,3.66a.222.222,0,0,1,.19.024.3.3,0,0,1,.164.2,1.452,1.452,0,0,1-.209.873,5.753,5.753,0,0,0-.63-.485.143.143,0,0,0,.021-.031A1.057,1.057,0,0,1,10.925,3.66Zm-6.857-1.1a1.26,1.26,0,0,1-.958,0,.407.407,0,0,1-.169-.319c-.071-.628.625-.806,1.472-.958l.207-.038L7.05.769A3.224,3.224,0,0,1,7.642.7a1,1,0,0,1,.492.107.631.631,0,0,1,.311.433.3.3,0,0,1-.1.264.772.772,0,0,1-.133.1A4.049,4.049,0,0,1,7,1.941c-.162.029-.311.057-.437.086-.326.076-.663.138-.991.2a14.094,14.094,0,0,0-1.5.333Zm1.415.157.171-.031c.214-.04.43-.081.649-.126l.078.742c-.155.019-.309.043-.464.074-.1.019-.195.043-.29.067ZM1.763,5.8a2.886,2.886,0,0,1-.575-.3c-.055-.074-.076-.138-.057-.174s.131-.107.3-.107a1.861,1.861,0,0,1,.963.264A.174.174,0,0,0,2.44,5.5c-.119.15-.233.3-.338.464-.1-.05-.214-.1-.34-.159Zm6.429,8.854A5.52,5.52,0,1,1,6.011,3.831a5.575,5.575,0,0,1,1.1-.109A5.52,5.52,0,0,1,8.191,14.653Z"
              transform="translate(-0.655 -0.231)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22972"
              data-name="Path 22972"
              d="M7.416,3.813A.235.235,0,0,0,7.1,3.9L5.488,6.659a.851.851,0,0,0-.43-.024.882.882,0,0,0,.174,1.747.859.859,0,0,0,.174-.017A.882.882,0,0,0,6.1,7.327a.86.86,0,0,0-.214-.418L7.5,4.131a.235.235,0,0,0-.086-.319Zm-2.1,4.1a.416.416,0,1,1-.164-.815.492.492,0,0,1,.083-.007.415.415,0,0,1,.228.069.415.415,0,0,1-.147.754Z"
              transform="translate(1.193 1.544)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22973"
              data-name="Path 22973"
              d="M4.839,11.3A3.888,3.888,0,0,1,2.5,7.04,4.288,4.288,0,0,1,6.265,3.579a.233.233,0,0,0-.05-.464A4.755,4.755,0,0,0,2.043,6.957a4.387,4.387,0,0,0,2.589,4.762.232.232,0,0,0,.1.024.231.231,0,0,0,.1-.44Z"
              transform="translate(0.004 1.21)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22974"
              data-name="Path 22974"
              d="M9.209,5.14a4.783,4.783,0,0,0,.04,1.1,4.956,4.956,0,0,0,.133,1.094,3.064,3.064,0,0,0,.031-1.108A3.066,3.066,0,0,0,9.209,5.14Z"
              transform="translate(3.613 2.223)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22975"
              data-name="Path 22975"
              d="M9.882,6.459a2.968,2.968,0,0,0-.221-1.213,9.915,9.915,0,0,0,.055,1.217,10.435,10.435,0,0,0,.033,1.217A2.953,2.953,0,0,0,9.882,6.459Z"
              transform="translate(3.841 2.276)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22976"
              data-name="Path 22976"
              d="M1.23,8.776c-.045,0-.043.262.136.511s.423.335.44.295-.152-.176-.3-.392S1.278,8.769,1.23,8.776Z"
              transform="translate(-0.379 4.041)"
              fill="#8d8d8d"
            />
            <path
              id="Path_22977"
              data-name="Path 22977"
              d="M.894,8.749a1.349,1.349,0,0,0,.152.92,1.339,1.339,0,0,0,.6.713c.033-.036-.247-.333-.452-.782S.944,8.747.894,8.749Z"
              transform="translate(-0.549 4.028)"
              fill="#8d8d8d"
            />
          </g>
          <rect
            id="Rectangle_6169"
            data-name="Rectangle 6169"
            width="15"
            height="15"
            transform="translate(30 116)"
            fill="none"
          />
        </g>
      </svg>

      <span className="ml-[5px] text-[#1D1D1D] text-[12px] regular">
        {formatTime(time)}
      </span>
    </div>
  );
};
const OrderItemId = ({ id }: OrderItemIdPropsType) => {
  return (
    <div className="flex-row items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="15"
        height="15"
        viewBox="0 0 15 15"
      >
        <defs>
          <clipPath id="clip-path23">
            <rect
              id="Rectangle_6211"
              data-name="Rectangle 6211"
              width="15"
              height="15"
              transform="translate(0 -0.412)"
              fill="none"
            />
          </clipPath>
        </defs>
        <g
          id="Mask_Group_726"
          data-name="Mask Group 726"
          transform="translate(0 0.412)"
          clipPath="url(#clip-path23)"
        >
          <g
            id="Group_13514"
            data-name="Group 13514"
            transform="translate(1.063 -0.103)"
          >
            <g id="bag-5">
              <g id="Group_2946" data-name="Group 2946">
                <path
                  id="Path_15168"
                  data-name="Path 15168"
                  d="M61.763,41.44H70.8a1.763,1.763,0,0,0,1.763-1.763.188.188,0,0,0,0-.033l-1.469-8.28a.973.973,0,0,0-.966-.825H69.068v-1a2.788,2.788,0,1,0-5.577,0v1H62.435a.973.973,0,0,0-.966.825L60,39.644a.19.19,0,0,0,0,.033,1.763,1.763,0,0,0,1.763,1.763Zm2.114-11.9a2.4,2.4,0,1,1,4.808,0v1H63.876Zm-2.027,1.891h0a.588.588,0,0,1,.588-.5h1.057v1.521a.2.2,0,1,0,.385,0V30.924h4.808v1.521a.2.2,0,1,0,.385,0V30.924h1.057a.588.588,0,0,1,.588.5h0L72.18,39.69A1.38,1.38,0,0,1,70.8,41.052H61.763a1.38,1.38,0,0,1-1.379-1.362Z"
                  transform="translate(-59.999 -26.753)"
                  fill="#8d8d8d"
                />
              </g>
            </g>
            <path
              id="Path_15172"
              data-name="Path 15172"
              d="M0,0A5.762,5.762,0,0,0,3.191,1.314,6.914,6.914,0,0,0,6.606,0"
              transform="translate(2.977 9.176)"
              fill="none"
              stroke="#f74949"
              strokeLinecap="round"
              strokeWidth="0.5"
            />
          </g>
        </g>
      </svg>
      <span className="ml-[5px] text-[#1D1D1D] text-[12px] medium">{id}</span>
    </div>
  );
};
