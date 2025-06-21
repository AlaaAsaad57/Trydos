import React, { useState } from "react";
import { translateFunction } from "utils/functions";
import ChangeAddressIcon from "public/svg/ChangeAddressIcon.svg";
import ModifyOrderIcon from "public/svg/ModifyOrderIcon.svg";
import { toast } from "react-toastify";
import ChangeAddressWidget from "./ChangeAddressWidget";
import { useAppStore } from "store";
import ModifyOrderWidget from "./ModifyOrderWidget";
import CancelOrderConfirmation from "./CancelOrderConfirmation";
import OrderItemOptionsModal from "./OrderItemOptionsModal";
import ReturnOrderItemConfirmation from "./ReturnOrderItemConfirmation";
import OrderItem from "./OrderItem";
import HideOrderItemIcon from "public/svg/HideOrderItemIcon.svg";
import OrderCancelIcon from "public/svg/OrderCancelIcon.svg";

function OrderOptions({ closeOptions, CancelOrder }) {
  const {
    selectedOrder,
    SelectedOrderItem,
    setSelectedOrderItem,
    setOrderDetails,
  } = useAppStore();
  const [screen, setScreen] = useState<
    "options" | "changeAddress" | "modifyOrder"
  >("options");
  const [canceled, setCanceled] = useState(false);

  const [shouldConfirmCancel, setShouldConfirmCancel] = useState(false);
  const [shouldConfirmReturn, setShouldConfirmReturn] = useState(false);
  const [shouldConfirmChange, setShouldConfirmChange] = useState(false);
  const [tempOrderDetails, setTempOrderDetails] = useState([]);
  const changeOrderItem = ({ id, color, size, qty, image }) => {
    let order_details_arry = [];

    selectedOrder.details.map((order_detail) => {
      let details_arry = { ...order_detail, details: [] };
      order_detail.details.map((s) => {
        if (s.id === id) {
          let new_detail = { ...s, image };
          if (s.variation) {
            if (s.variation.color !== color) {
              new_detail = {
                ...new_detail,
                variation: { ...new_detail.variation, color },
              };
            }
            if (s.variation.Size !== size) {
              new_detail = {
                ...new_detail,
                variation: { ...new_detail.variation, Size: size },
              };
            }
          }
          if (qty !== s.qty) {
            new_detail = { ...new_detail, qty };
          }
          details_arry.details.push(new_detail);
        } else {
          details_arry.details.push(s);
        }
      });
      order_details_arry.push(details_arry);
    });
    setTempOrderDetails({ ...selectedOrder, details: order_details_arry });
  };
  const ReturnItem = () => {
    let order_details_arry = [];
    selectedOrder.details.map((order_detail) => {
      let details_arry = { ...order_detail, details: [] };
      order_detail.details.map((s) => {
        if (s.id === SelectedOrderItem.id) {
          details_arry.details.push({ ...s, is_returned: true });
        } else {
          details_arry.details.push(s);
        }
      });
      order_details_arry.push(details_arry);
    });
    setOrderDetails({ ...selectedOrder, details: order_details_arry });
  };
  const CancelItem = (id) => {
    let order_details_arry = [];
    selectedOrder.details.map((order_detail) => {
      let details_arry = { ...order_detail, details: [] };
      order_detail.details.map((s) => {
        if (s.id === id) {
          details_arry.details.push({ ...s, is_canceled: true });
        } else {
          details_arry.details.push(s);
        }
      });
      order_details_arry.push(details_arry);
    });
    setOrderDetails({ ...selectedOrder, details: order_details_arry });
  };
  const renderScreen = () => {
    if (SelectedOrderItem) {
      return (
        <>
          {(shouldConfirmCancel || shouldConfirmChange) && (
            <CancelOrderConfirmation
              close={() => {
                closeOptions();
                if (shouldConfirmChange) {
                  setOrderDetails(tempOrderDetails);
                }
                if (shouldConfirmCancel) {
                  setOrderDetails(tempOrderDetails);
                }
                setShouldConfirmCancel(false);
                setShouldConfirmChange(false);
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
                ReturnItem();
              }}
              setShouldConfirmReturn={setShouldConfirmReturn}
            />
          )}
          <OrderItemOptionsModal
            changeOrderItem={changeOrderItem}
            cancelOrderItem={(id) => {
              CancelItem(id);
            }}
            setShouldConfirmChange={setShouldConfirmChange}
            setShouldConfirmCancel={setShouldConfirmCancel}
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
    if (screen === "options") {
      return (
        <>
          {shouldConfirmCancel && (
            <CancelOrderConfirmation
              close={() => {
                closeOptions();
                CancelOrder();
              }}
              setShouldConfirmCancel={setShouldConfirmCancel}
            />
          )}
          <div className="flex-col max-h-[calc(100vh-100px)] items-center overflow-auto w-full pt-[14px] px-[24px] z-[999999999] pb-[27px] absolute bottom-[0px]  left-0 rounded-t-[30px] bg-white">
            <span className="w-[40px] h-[4px] bg-[#C4C2C2] rounded-[2px]"></span>
            <div className="flex-col  items-center w-full justify-center flex-1">
              <OrderItem
                key={selectedOrder.order_group_id}
                order={selectedOrder}
                showDetails={() => {}}
              />
              <span className="regular text-[12px] mt-[11px] text-[#8D8D8D]">
                {translateFunction("Action About Your Order")}
              </span>
              <div
                className="w-full h-[1px] mt-[12px]"
                style={{ borderTop: "1px solid #C4C2C280" }}
              />
            </div>
            <div
              onClick={() => {
                setScreen("changeAddress");
              }}
              className="cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px]"
            >
              <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                <ChangeAddressIcon />
              </div>
              <div className="flex-col ml-[15px]">
                <span className="regular text-[14px] text-[#1D1D1D] medium">
                  {translateFunction("Change Delivery Address & Note")}
                </span>
                <p className="regular text-[12px] text-[#8D8D8D]">
                  {translateFunction("You Can Change Delivery Address")}
                </p>
              </div>
            </div>
            <div
              onClick={() => {
                // setScreen("changeAddress");
              }}
              className="cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px]"
            >
              <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                <HideOrderItemIcon />
              </div>
              <div className="flex-col ml-[15px]">
                <span className="regular text-[14px] text-[#1D1D1D] medium">
                  {translateFunction("Hide This Product")}
                </span>
                <p className="regular text-[12px] text-[#8D8D8D]">
                  {translateFunction("Hide This Product From My List")}
                </p>
              </div>
            </div>
            <div
              onClick={() => {
                setCanceled(true);
              }}
              className="cursor-pointer mt-[6px] flex-row w-full items-center px-[15px] bg-[#f8f8f8] rounded-[20px] min-h-[60px]"
            >
              <div className="relative flex w-[30px] h-[30px] items-center justify-center">
                <OrderCancelIcon />
              </div>
              <div className="flex-col ml-[15px]">
                <span className="regular text-[14px] text-[#1D1D1D] medium">
                  {translateFunction("Cancel This Order")}
                </span>
                <p className="regular text-[12px] text-[#8D8D8D]">
                  {translateFunction(
                    "You Can Cancel This Order And Back Your Money"
                  )}
                </p>
              </div>
            </div>

            {canceled && (
              <OrderCanceltionOptions
                setShouldConfirmCancel={setShouldConfirmCancel}
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
          close={() => {
            setScreen("options");
          }}
          address_id={selectedOrder?.shipping_address}
        />
      );
    }
    if (screen === "modifyOrder") {
      return (
        <ModifyOrderWidget
          close={() => {
            setScreen("options");
          }}
          order_items={selectedOrder?.details}
        />
      );
    }
  };
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
const OrderCanceltionOptions = ({ close, setShouldConfirmCancel }) => {
  let options = [
    "I Changed My Mind",
    "I Fear Quality",
    "I Fear The Delivery Time",
    "I’m Afraid Of Sizes",
    "I Saw A Better Price",
  ];
  const [selectedOptions, setSelectedOptions] = useState([]);
  const handleOptionClick = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };
  return (
    <div className="flex-col mt-[20px] flex-1">
      <div className="flex-row w-full  items-center justify-center">
        <span className="regular text-[12px] text-[#8D8D8D]">
          {translateFunction("Why Was The Order Cancelled?")}
        </span>
        <span className="medium text-[12px] text-[#402CDD] ml-[4px]">
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
            } else
              toast.info("Please select a reason for canceling this order");
          }}
        >
          {translateFunction("Cancel Order")}
        </div>
      </div>
    </div>
  );
};
