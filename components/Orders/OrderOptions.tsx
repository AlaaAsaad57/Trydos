import { OrdersIcon } from "components/settings/OrdersList";
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
  const renderScreen = () => {
    if (SelectedOrderItem) {
      return (
        <>
          {shouldConfirmReturn && (
            <ReturnOrderItemConfirmation
              close={() => {
                closeOptions();
                setShouldConfirmReturn(false);
                let details_arry = [];
                selectedOrder.details.map((s) => {
                  if (s.id === SelectedOrderItem.id) {
                    details_arry.push({ ...s, is_returned: true });
                  } else {
                    details_arry.push(s);
                  }
                });
                setOrderDetails({ ...selectedOrder, details: details_arry });
              }}
              setShouldConfirmReturn={setShouldConfirmReturn}
            />
          )}
          <OrderItemOptionsModal
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
          <div className="flex-col max-h-[calc(100vh-100px)] overflow-auto w-full pt-[14px] px-[24px] z-[999999999] pb-[27px] absolute bottom-[0px]  left-0 rounded-t-[30px] bg-white">
            <div className="flex-col  items-center w-full justify-center">
              <OrdersIcon />
              <span className="medium text-[#1D1D1D] text-[14px] mt-[5px] ">
                {translateFunction("Manage Your Order")}
              </span>
              <div
                className="w-full h-[1px] mt-[22px]"
                style={{ borderTop: "1px solid #C4C2C280" }}
              />
            </div>
            <div
              className="flex-row w-full min-h-[50px] mt-[33px] bg-[#F8F8F8] rounded-[20px] px-[12px] items-center justify-between"
              onClick={() => {
                setScreen("changeAddress");
              }}
            >
              <ChangeAddressIcon />
              <span className="regular text-[#8D8D8D] text-[14px]">
                {translateFunction("Change Delivery Address & Note")}
              </span>
              <span />
            </div>
            <div
              className="flex-row w-full min-h-[50px] mt-[8px] bg-[#F8F8F8] rounded-[20px] px-[12px] items-center justify-between"
              onClick={() => {
                setScreen("modifyOrder");
              }}
            >
              <ModifyOrderIcon />
              <span className="regular text-[#8D8D8D] text-[14px]">
                {translateFunction("Modify Order")}
              </span>
              <span />
            </div>
            <div
              className="flex-row w-full min-h-[50px] mt-[8px] bg-[#F8F8F8] rounded-[20px] px-[12px] items-center justify-center"
              onClick={() => {}}
            >
              <span className="regular text-[#8D8D8D] text-[14px]">
                {translateFunction(
                  "Information About Your Order Modify Or Cancel"
                )}
              </span>
            </div>
            <div
              style={{ border: "1px solid #FF5F6180" }}
              className={`flex-col meduim 
             mt-[20px]
             text-[#FF5F61] text-[14px] w-full h-[50px]  bg-[#F8F8F8] rounded-[20px] px-[12px] items-center justify-center`}
              onClick={() => {
                setCanceled(true);
              }}
            >
              <span>{translateFunction("Cancel Order")}</span>
              <span className="regular text-[12px] text-[#FF5F61]">
                {translateFunction("You Can Cancel & Back Your Money")}
              </span>
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
