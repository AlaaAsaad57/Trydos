import React from "react";
import { translateFunction, RoundPrice } from "utils/functions";
import { OrderItem as OrderItemType } from "../../types/orders";
import Image from "next/image";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import NextLink from "components/global/NextLink";

interface OrderItemProps {
  order: OrderItemType;
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  const currency = useSelector(
    (state: StateInterface) => state.homepage.currency
  ) || { symbol: "" };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "ready_to_shipping":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "out_for_delivery":
        return "bg-green-100 text-green-800";
      case "partial_return":
        return "bg-red-100 text-red-800";
      case "returned":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "canceled_archived":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const { lang } = useParams();
  return (
    <div className="border-b border-gray-200 p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm text-gray-500">
            {translateFunction("Order")} #{order.id}
          </span>
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              order.order_status
            )}`}
          >
            {translateFunction(order.order_status)}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
              order.payment_status
            )}`}
          >
            {translateFunction(order.payment_status)}
          </span>
          <span className="text-xs text-gray-500">
            {translateFunction(order.payment_method)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {order.details.map((detail) => (
          <NextLink
            key={detail.id}
            className="flex gap-3"
            href={`/${lang}/products/${detail.product_details.slug}`}
          >
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={detail.product_details.thumbnail}
                alt={detail.product_details.name}
                fill
                className="object-cover rounded-md"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                {detail.product_details.name}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {detail.qty} x {currency.symbol}
                {RoundPrice({ num: detail.price_after_discount })}
              </div>
              {detail.variation && (
                <div className="mt-1 text-xs text-gray-400">
                  {Object.entries(detail.variation)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
                </div>
              )}
            </div>
          </NextLink>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{translateFunction("Total")}</span>
          <span className="font-medium">
            {currency.symbol}
            {RoundPrice({ num: order.order_amount + order.shipping_cost })}
          </span>
        </div>
        {order.shipping_cost > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">
              {translateFunction("Shipping")}
            </span>
            <span className="font-medium">
              {currency.symbol}
              {RoundPrice({ num: order.shipping_cost })}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        <p>
          {translateFunction("Shipping Address")}:{" "}
          {order.shipping_address_data.address}
        </p>
        <p>
          {order.shipping_address_data.city},{" "}
          {order.shipping_address_data.province},{" "}
          {order.shipping_address_data.country}
        </p>
      </div>
    </div>
  );
};

export default OrderItem;
