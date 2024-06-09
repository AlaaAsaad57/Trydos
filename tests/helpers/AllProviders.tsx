import Init from "../../components/Home/Init";
import TranslationsMenu from "../../components/global/TranslationsMenu";
import { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const AllProviders = ({ children }: PropsWithChildren) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  let store: any;
  const middlewares: any[] = [];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    store = mockStore({});
  });
  return (
    <QueryClientProvider client={client}>
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default AllProviders;
