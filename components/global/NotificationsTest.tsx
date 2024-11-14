import React, { useState } from "react";
import NotifyIcon from "public/svg/cart/NotifyCart.svg";
import home from "services/home";
function NotificationsTest() {
  const [enable, setEnable] = useState(false);
  const NotifyBoutique = () => {};
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
                <span>
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
                <span>
                  product QTy or variant or products available in wanted
                  products or old carts (should open product details)
                </span>
                <div className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md">
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span>
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
                <span>
                  wishlist products has discount (should open product details
                  page)
                </span>
                <div className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md">
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span>
                  {" "}
                  if products in wishlist or old cart or cart has new comment or
                  buyer cammera (should open product details)
                </span>
                <div className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md">
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span>
                  new category added(should open category que page product
                  listing filtered by category )
                </span>
                <div className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md">
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span>
                  when user open product details page and all qty in users
                  carts: user should not see add to cart, otherwise user should
                  see notify me when avaible and when product moved to old cart
                  , user should recieve this prouduct current available (should
                  open product details)
                </span>
                <div className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md">
                  Test
                </div>
              </div>
              <div className="flex-row justify-between p-3">
                <span>
                  when user open product details page and all qty in users
                  carts: user should not see add to cart, otherwise user should
                  see notify me when avaible and when product moved to old cart
                  , user should recieve this prouduct current available (should
                  open product details)
                </span>
                <div className="p-2 flex justify-center items-center cursor-pointer text-[#fafafa]  bg-slate-800 rounded-md">
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
