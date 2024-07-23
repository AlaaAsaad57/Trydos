import Init from "../../components/Home/Init";
import TranslationsMenu from "../../components/global/TranslationsMenu";
import { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { store } from "store";
import PageLoadingIndicator from "Hooks/LoadingIndicator";
import Teststore from "./createStore";
import { getCurrency } from "store/homepage/cachedActions";

const AllProviders = async ({ children }: PropsWithChildren) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  // let store: any;
  // const middlewares: any[] = [];
  // const mockStore = configureStore(middlewares);

  // beforeEach(() => {
  //   store = mockStore({});
  // });
  const currency = await getCurrency({
    lang: "en",
    country: "tr",
  });
  return (
    <QueryClientProvider client={client}>
      {/* {SSRDetect() && <GAComponent />} */}
      <Init />
      <PageLoadingIndicator />
      <Provider store={Teststore}>
        <div className="site-container">
          <div className="home-page-container">
            <>
              <TranslationsMenu currency={currency} init={"en-us"} />
            </>

            {children}
          </div>
        </div>
      </Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default AllProviders;
