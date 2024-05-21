"use client";
import { Provider } from "react-redux";
import { store } from "./index";
import { useEffect } from "react";
import HomeService from "services/home";
import GAComponent from "components/global/GAComponent";
import { SSRDetect } from "utils/functions";
import { ReactQueryClientProvider } from "components/Providers/ReactQueryClientProvider";
export default function Providers({ children }) {
  var bool = true;

  useEffect(() => {
    if (bool) {
      bool = false;
      setTimeout(() => {
        HomeService.RegisterDevice();
        HomeService.CheckLogin();
      }, 2000);
    }
  }, []);
  return (
    <ReactQueryClientProvider>
      {SSRDetect() && <GAComponent />}
      <Provider store={store}>{children}</Provider>
    </ReactQueryClientProvider>
  );
}
