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

      <Suspense fallback={<></>}>
        <CartProvider />
      </Suspense>

      {children}

      {SSRDetect() && <GAComponent />}
    </>
  );
}
