"use client";
import { Provider } from "react-redux";
import { store } from "./index";
import GAComponent from "components/global/GAComponent";
import { SSRDetect } from "utils/functions";
import { ReactQueryClientProvider } from "components/Providers/ReactQueryClientProvider";
import Init from "components/Home/Init";
export default function Providers({ children }) {
  return (
    <ReactQueryClientProvider>
      <Init />
      <Provider store={store}>{children}</Provider>
      {SSRDetect() && <GAComponent />}
    </ReactQueryClientProvider>
  );
}
