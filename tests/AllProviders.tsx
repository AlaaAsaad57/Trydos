import Init from "../components/Home/Init";
import { ReactQueryClientProvider } from "../components/Providers/ReactQueryClientProvider";
import TranslationsMenu from "../components/global/TranslationsMenu";
import { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { store } from "../store";

const AllProviders = ({ children }: PropsWithChildren) => {
  return (
    <ReactQueryClientProvider>
      {/* {SSRDetect() && <GAComponent />} */}
      <Init />
      <Provider store={store}>
        <div className="site-container">
          <div className="home-page-container">
            <>
              <TranslationsMenu init={"en-US"} />
            </>
            {children}
          </div>
        </div>
      </Provider>
    </ReactQueryClientProvider>
  );
};

export default AllProviders;
