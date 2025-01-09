import React, { useState } from "react";
import NotifyIcon from "public/svg/cart/NotifyCart.svg";
import home from "services/home";
import { useSelector } from "react-redux";

function NotificationsTest() {
  const [enable, setEnable] = useState(false);
  const starttingSetting = useSelector(
    (state: StateInterface) => state.homepage.settings
  );
  return (
    <div className="flex">
      <NotifyIcon onClick={() => setEnable(true)} />
      {enable && (
        <>
          <div
            className="lang-modalDisable top-0 left-0"
            onClick={() => setEnable(false)}
          />
          <div className="app bg-slate-100 top-[110px] right-8">
            <div className="flex-col">
              <div className="flex-row justify-between p-3">
                <span className="test">
                  new boutique added (should open boutique page product listing
                  filtered by boutique) (done)
                </span>
                <div
                  className="p-2 flex justify-center items-center bg-slate-800 cursor-pointer text-[#fafafa] rounded-md"
                  onClick={() =>
                    home.TestNotificationBoutique({ boutique_id: 66 })
                  }
                >
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span className="test">
                  product QTy or variant or products available in wanted
                  products or old carts (should open product details) (done)
                </span>
                <div
                  className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md"
                  onClick={async () => {
                    let type = starttingSetting.notificationTypes.filter(
                      (s) => s.name === "product availability"
                    )[0]?.id;
                    await home.StoreNotificationProduct({
                      type_id: type,
                      product_id: 5550,
                      variant: "Gold-XXL",
                    });
                    home.TestNotificationProductAvailable();
                  }}
                >
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span className="test">
                  product in cart removed and converted to old card(shoul open
                  cartpage) (done)
                </span>
                <div
                  className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md"
                  onClick={() => home.TestNotificationProductToOldCart()}
                >
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span className="test">
                  wishlist products has discount (should open product details
                  page)
                </span>
                <div
                  className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md"
                  onClick={() => {
                    // let type = starttingSetting.notificationTypes.filter(
                    //   (s) => s.name === "product discount"
                    // )[0]?.id;
                    // home.StoreNotificationProduct({
                    //   type_id:type,
                    //   product_id:5550,
                    //   variant:"Gold-XXL"
                    // });
                    home.TestNotificationProductDiscount();
                  }}
                >
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span className="test">
                  {" "}
                  if products in wishlist or old cart or cart has new comment or
                  buyer cammera (should open product details)
                </span>
                <div
                  className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md"
                  onClick={() => {
                    home.TestNotificationProductComment();
                  }}
                >
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span className="test">
                  new category added(should open category que page product
                  listing filtered by category ) (done)
                </span>
                <div
                  className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md"
                  onClick={() => {
                    home.TestNotificationCategoryCreated();
                  }}
                >
                  Test
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationsTest;
