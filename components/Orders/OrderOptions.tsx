import { useState } from "react";
import { RoundPrice, translateFunction } from "utils/functions";
import ChangeAddressIcon from "public/svg/ChangeAddressIcon";
import ChangeAddressWidget from "./ChangeAddressWidget";
import { useAppStore } from "store";
import CancelOrderConfirmation from "./CancelOrderConfirmation";
import OrderItemOptionsModal from "./OrderItemOptionsModal";
import ReturnOrderItemConfirmation from "./ReturnOrderItemConfirmation";
import OrderItem from "./OrderItem";
import HideOrderItemIcon from "public/svg/HideOrderItemIcon";
import OrderCancelIcon from "public/svg/OrderCancelIcon";

import { showErrorNotification } from "@/store/notifications/reducer";
import orderService from "services/order";
import { totalAmount } from "utils/tinyUtils";
import { useParams, useRouter } from "next/navigation";
import { ModifyOrderItemModal } from "./ModifyOrderItemModal";
import CancelOrderItemIcon from "public/svg/OrderCancelIcon";

function OrderOptions({
  closeOptions,
  CancelOrder,
  setShouldConfirmReturn,
  shouldConfirmReturn,
}: any) {
  const {
    selectedOrder,
    SelectedOrderItem,
    setSelectedOrderItem,
    setOrderDetails,
    ActivePacks,
    setOrderPageLoading,
    setActivePacks,
    setOrderOptions,
  } = useAppStore();
  const [screen, setScreen] = useState<"options" | "changeAddress">("options");
  const [canceled, setCanceled] = useState(false);
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";

  const [shouldConfirmCancel, setShouldConfirmCancel] = useState<any>(false);
  const [shouldConfirmChange, setShouldConfirmChange] = useState<any>(false);
  const router = useRouter();

  const getOrderDetails = async (noLoading?) => {
    // Abort any previous request
    if (!noLoading) setOrderPageLoading(true);
    try {
      let data = await orderService.getOrderDetails(
        selectedOrder.order_group_id,
        null
      );
      let returnRequests = undefined;
      let returned_req_ids = data?.map((s) => {
        if (s.return_request_id !== null && s.return_request_id !== undefined)
          return s.return_request_id;
      });
      returned_req_ids = returned_req_ids?.filter((s) => s !== undefined);

      if (returned_req_ids?.length > 0) {
        try {
          returnRequests = await orderService.GetReturnDetailsForOrderGroup({
            order_group_id: selectedOrder.order_group_id,
          });

          // Update data with the fetched details
          data = data.map((order) => {
            const match = returnRequests.find(
              (req) => req.id === order.return_request_id
            );
            return match
              ? {
                  ...order,
                  return_details: { ...match },
                  returned_data: returnRequests,
                }
              : { ...order, returned_data: returnRequests };
          });
        } catch (error) {
          console.error(error);
        }
      }
      let orderData = {
        ...data?.[0],
        order_amount: totalAmount(data),
        details: data,
      };
      if (ActivePacks?.id && data?.find((s) => s.id === ActivePacks?.id)) {
        setActivePacks(data?.find((s) => s.id === ActivePacks?.id));
      } else setActivePacks(data[0]);

      setOrderDetails(orderData);
    } catch (error) {
      // Don't handle error if it's an abort error
      if (error.name === "AbortError") {
        return;
      }

      let params = new URLSearchParams(window.location.search);
      params.delete("id");
      params.delete("order_id_chat");
      // @ts-ignore
      router.replace(`/${lang}/setting?${params.toString()}`, {
        scroll: false,
        // @ts-ignore
        shallow: true,
      });
      setSelectedOrderItem(false);
      setOrderDetails(null);
      setActivePacks(null);
      setSelectedOrderItem(null);
    }

    setOrderPageLoading(false);
  };

  const CancelItem = async () => {
    setOrderPageLoading(true);
    if (
      shouldConfirmCancel?.item_id ||
      shouldConfirmChange?.type == "CancelQty"
    ) {
      await orderService.CancelOrderItem(
        shouldConfirmCancel || shouldConfirmChange
      );
      setShouldConfirmCancel(false);
      setShouldConfirmChange(false);
    } else {
      await orderService.CancelOrder(shouldConfirmCancel);
      setShouldConfirmCancel(false);
      setShouldConfirmChange(false);
    }

    getOrderDetails();
    setOrderOptions(false);
  };
  const shouldShowChangeAddress = () => {
    let condition = true;
    selectedOrder?.details?.map((s) => {
      if (!s.can_update_address) condition = false;
    });
    return condition;
  };

  const renderScreen = () => {
    if (SelectedOrderItem) {
      return (
        <>
          {shouldConfirmChange?.type !== "CancelQty" &&
            (shouldConfirmChange?.type == "Color" ||
              shouldConfirmChange?.type == "Size") && (
              <ModifyOrderItemModal
                orderItem={SelectedOrderItem}
                setConfirmationData={(e) => {
                  setShouldConfirmChange(e);
                }}
                getOrderDetails={getOrderDetails}
                close={() => {
                  setShouldConfirmChange(false);
                  closeOptions();
                }}
                type={shouldConfirmChange?.type}
                confirmationData={shouldConfirmChange}
              />
            )}
          {(shouldConfirmCancel ||
            shouldConfirmChange?.type === "CancelQty") && (
            <CancelOrderConfirmation
              setShouldConfirmChange={setShouldConfirmChange}
              close={() => {
                closeOptions();
                setShouldConfirmCancel(false);
                setShouldConfirmChange(false);
              }}
              callback={() => {
                if (
                  shouldConfirmCancel ||
                  shouldConfirmChange?.type == "CancelQty"
                ) {
                  CancelItem();
                }
              }}
              setShouldConfirmCancel={(e) => {
                setShouldConfirmCancel(e);
                setShouldConfirmChange(e);
              }}
              topic={
                shouldConfirmChange
                  ? translateFunction("About Change Request Product")
                  : translateFunction("About Cancel Your Product")
              }
            />
          )}
          {shouldConfirmReturn && (
            <ReturnOrderItemConfirmation
              close={() => {
                closeOptions();
                setShouldConfirmReturn(false);
              }}
              callback={async (e?) => {
                await getOrderDetails(e);
              }}
              confirmationData={shouldConfirmReturn}
              setShouldConfirmReturn={setShouldConfirmReturn}
            />
          )}
          <OrderItemOptionsModal
            shouldConfirmChange={shouldConfirmChange}
            cancelOrderItem={(id) => {}}
            setShouldConfirmChange={setShouldConfirmChange}
            setShouldConfirmCancel={(e) => {
              if (e) {
                setShouldConfirmCancel({
                  order_id: ActivePacks?.id,
                  item_id: SelectedOrderItem.id,
                  qty: SelectedOrderItem.qty,
                });
              } else {
                setShouldConfirmCancel(false);
              }
            }}
            close={() => {
              closeOptions();
              setSelectedOrderItem(null);
            }}
            setShouldConfirmReturn={setShouldConfirmReturn}
            item={SelectedOrderItem}
          />
        </>
      );
    }
    if (shouldConfirmReturn) {
      return (
        <>
          {shouldConfirmReturn && (
            <ReturnOrderItemConfirmation
              close={() => {
                closeOptions();
                setShouldConfirmReturn(false);
              }}
              callback={async (e?) => {
                await getOrderDetails(e);
              }}
              confirmationData={shouldConfirmReturn}
              setShouldConfirmReturn={setShouldConfirmReturn}
            />
          )}
        </>
      );
    }
    if (screen === "options") {
      return (
        <>
          {shouldConfirmCancel && (
            <CancelOrderConfirmation
              close={() => {
                closeOptions();
                setOrderOptions(false);
                CancelOrder();
              }}
              setShouldConfirmChange={setShouldConfirmChange}
              setShouldConfirmCancel={setShouldConfirmCancel}
              callback={() => {
                if (shouldConfirmCancel) {
                  CancelItem();
                }
              }}
            />
          )}
          <div className="flex-col max-h-[calc(100vh-100px)] items-center overflow-auto w-full pt-[14px] px-[24px] z-[999999999] pb-[27px] absolute bottom-[0px]  left-0 rounded-t-[30px] bg-white">
            <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
            <div className="flex-col  items-center w-full justify-center flex-1">
              <OrderItem
                key={selectedOrder.order_group_id}
                order={ActivePacks}
                showDetails={() => {}}
              />
              {!canceled && (
                <>
                  <span className="regular text-[12px] mt-[11px] text-[#8D8D8D]">
                    {translateFunction("Action About Your Order")}
                  </span>
                  <div
                    className="w-full h-[1px] mt-[12px]"
                    style={{ borderTop: "1px solid #C4C2C280" }}
                  />
                </>
              )}
            </div>

            {!canceled && (
              <>
                {shouldShowChangeAddress() && (
                  <div
                    onClick={() => {
                      setScreen("changeAddress");
                    }}
                    className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                      isRtl ? "flex-row-reverse" : " "
                    }`}
                  >
                    <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                      <ChangeAddressIcon />
                    </div>
                    <div className="flex-col ml-[15px]">
                      <span
                        className={`regular text-[14px] text-[#1D1D1D] medium ${
                          isRtl ? " text-right pr-2" : " "
                        }`}
                      >
                        {translateFunction("Change Delivery Address & Note")}
                      </span>
                      <p
                        className={`regular text-[12px] text-[#8D8D8D] ${
                          isRtl ? "pr-2 text-right" : " "
                        }`}
                      >
                        {translateFunction("You Can Change Delivery Address")}
                      </p>
                    </div>
                  </div>
                )}
                {
                  <div
                    onClick={() => {
                      // setScreen("changeAddress");
                    }}
                    className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                      isRtl ? "flex-row-reverse" : " "
                    }`}
                  >
                    <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                      <HideOrderItemIcon />
                    </div>
                    <div className="flex-col ml-[15px]">
                      <span
                        className={`regular text-[14px] text-[#1D1D1D] medium ${
                          isRtl ? " text-right pr-2" : " "
                        }`}
                      >
                        {translateFunction("Hide This Pack")}
                      </span>
                      <p
                        className={`regular text-[12px] text-[#8D8D8D] ${
                          isRtl ? "pr-2 " : " "
                        }`}
                      >
                        {translateFunction("Hide This Pack From My List")}
                      </p>
                    </div>
                  </div>
                }
                {ActivePacks?.can_cancele_order && (
                  <div
                    onClick={() => {
                      setCanceled(true);
                    }}
                    className={`cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px] ${
                      isRtl ? "flex-row-reverse" : " "
                    }`}
                  >
                    <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                      <OrderCancelIcon />
                    </div>
                    <div className="flex-col ml-[15px]">
                      <span
                        className={`regular text-[14px] text-[#1D1D1D] medium ${
                          isRtl ? " text-right pr-2" : " "
                        }`}
                      >
                        {translateFunction("Cancel This Pack")}
                        <span className="mx-1 bold">{ActivePacks?.id}</span>
                      </span>
                      <p
                        className={`regular text-[12px] text-[#8D8D8D] ${
                          isRtl ? "pr-2 " : " "
                        }`}
                      >
                        {translateFunction(
                          "You Can Cancel This Pack And Back Your Money"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {canceled && (
              <OrderCanceltionOptions
                setShouldConfirmCancel={(e) => {
                  if (e) {
                    setShouldConfirmCancel({
                      order_id: ActivePacks?.id,
                    });
                  } else {
                    setShouldConfirmCancel(e);
                  }
                }}
                close={() => {
                  setCanceled(false);
                  setScreen("options");
                  closeOptions();
                }}
              />
            )}
          </div>
        </>
      );
    }
    if (screen === "changeAddress") {
      return (
        <ChangeAddressWidget
          getOrderDetails={getOrderDetails}
          close={() => {
            closeOptions();
            setScreen("options");
          }}
          address_id={selectedOrder?.shipping_address}
        />
      );
    }
  };
  if (!selectedOrder || !selectedOrder?.id || !ActivePacks?.id) return null;
  return (
    <>
      <div
        className="absolute top-[0px]   left-0 min-w-[100vw] z-[999999998] min-h-[100vh] opacity-40 bg-[black]"
        onClick={() => {
          closeOptions();
          setScreen("options");
          setSelectedOrderItem(null);
        }}
      />
      {renderScreen()}
    </>
  );
}

export default OrderOptions;
const OrderCanceltionOptions = ({ close, setShouldConfirmCancel }: any) => {
  let options = [
    "I Changed My Mind",
    "I Fear Quality",
    "I Fear The Delivery Time",
    "I’m Afraid Of Sizes",
    "I Saw A Better Price",
  ];
  const { ActivePacks, currency, language } = useAppStore();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const handleOptionClick = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };
  const isRtl = language === "ar" || language === "ku";
  return (
    <div className="flex-col mt-[20px] flex-1">
      <div className="flex-col w-full items-center pb-[12px] px-[24px]">
        <div className="">
          <CancelOrderItemIcon className="mt-[12px] [&>path]:fill-[#402CDD]" />
        </div>
        <span className="medium text-[14px] mt-[11px] text-[#1D1D1D]">
          {translateFunction("Cancel This Pack")}
        </span>
        <p
          className={`${
            isRtl ? "dir-rtl" : ""
          } flex gap-[4px] text-[#8D8D8D] text-[12px] regular text-center`}
        >
          {translateFunction(
            "You Can Cancel The Product Without Any Conditions According To The Cancel Policy And Get A Full Refund"
          )}
          <span className="bold text-[12px] text-[#8D8D8D]">
            {RoundPrice({
              num: ActivePacks.order_amount,
              rate: currency?.exchange_rate,
              language: language,
              returnNumber: true,
            })}
          </span>
          <span className="text-[#8D8D8D]">{currency?.symbol}</span>
          {translateFunction("To Your Account")}.
        </p>
        <span className="border-[#C4C2C280] border-b-[1px] w-full mt-[12px]" />
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  w-full  items-center justify-center`}
      >
        <span className="regular text-[12px] text-[#8D8D8D]">
          {translateFunction("Why Was The Order Cancelled?")}
        </span>
        <span className="medium text-[12px] text-[#402CDD] mx-[4px]">
          {translateFunction("Learn More Tips.")}
        </span>
      </div>
      <div className="flex-row w-full flex-wrap items-center mt-[12px] gap-y-[10px]  gap-x-[12px] pr-[30px]">
        {options.map((option, index) => (
          <div
            key={option}
            className={`px-[12px] w-auto regular text-[12px] text-[#5D5C5D] flex-row h-[39px] justify-start items-center rounded-[12px] bg-[#F8F8F8] `}
            style={{
              flex: "0 1 auto",
              border: selectedOptions.includes(option)
                ? "1px solid #402CDD80"
                : "none",
            }}
            onClick={() => {
              handleOptionClick(option);
            }}
          >
            <span className="regular text-[12px] text-[#8D8D8D]">
              {translateFunction(option)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-[20px]">
        <div className="flex-row w-full items-center justify-center h-[50px] bg-[#388CFF] rounded-[20px] text-white text-[14px] medium">
          {translateFunction(
            "We Have Other Solutions Instead Of Cancellation."
          )}
        </div>
        <div
          className={`${
            selectedOptions?.length > 0 ? "bg-[#FF5F61]" : "bg-[#D3D3D3]"
          } rounded-[20px] text-white text-[14px] medium h-[50px] flex-row w-full items-center justify-center mt-[20px]`}
          onClick={() => {
            if (selectedOptions) {
              setShouldConfirmCancel(true);
            } else {
              showErrorNotification(
                translateFunction(
                  "Please select a reason for canceling this order"
                )
              );
            }
          }}
        >
          {translateFunction("Cancel Order")}
        </div>
      </div>
    </div>
  );
};
