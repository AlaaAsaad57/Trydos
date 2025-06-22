import Init from "components/Home/Init";
import CartProvider from "components/Cart/CartProvider";
import { Suspense } from "react";
import NotificationsContainer from "components/global/NotificationsContainer";

export default function Providers({ children }) {
  return (
    <>
      <Suspense fallback={<></>}>
        <Init />
      </Suspense>

      <Suspense fallback={<></>}>
        <CartProvider />
      </Suspense>
      <NotificationsContainer />
      {children}
    </>
  );
}
