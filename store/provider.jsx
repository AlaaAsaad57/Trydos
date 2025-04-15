"use client";
import { Provider } from "react-redux";
import { store } from "./index";
import GAComponent from "components/global/GAComponent";
import { SSRDetect } from "utils/functions";
import Init from "components/Home/Init";
import CartProvider from "components/Cart/CartProvider";
import { Suspense } from "react";

export default function Providers({ children }) {
  return (
    <>
      <Suspense fallback={<></>}>
        <Init />
      </Suspense>
      <Provider store={store}>
        <Suspense fallback={<></>}>
          <CartProvider />
        </Suspense>

        {children}
      </Provider>
      {SSRDetect() && <GAComponent />}
    </>
  );
}
