import ConfirmMobile from "components/Cart/ConfirmMobile";
import React, { useEffect } from "react";
import { useAppStore } from "store";
import { ChatConroller, DisableScroll, EnableScroll } from "utils/tinyUtils";
import { showSuccessNotification } from "store/notifications/reducer";
import { createPortal } from "react-dom";

function ConfirmMobilePhoneWidget() {
  const {
    setShouldAuthinticated,
    shouldAuthinticated,
    setAddStory,
    openChat,
    setReAuthResult,
  } = useAppStore();
  useEffect(() => {
    DisableScroll();

    return () => {
      EnableScroll();
    };
  }, []);
  const userData = useAppStore.getState().userProfile;
  const copyInitialData = async () => {
    let last_verify_date = localStorage.getItem("LAST-VERIFY");
    let last_unauthorized_request = localStorage.getItem(
      "last_unauthorized_request",
    );
    await navigator.clipboard.writeText(
      JSON.stringify({ last_verify_date, last_unauthorized_request }, null, 2),
    );
    showSuccessNotification("copy reason of  verification success!");
  };

  return (
    <>
      {createPortal(
        <>
          <div className="fixed top-0 left-0 w-screen h-screen z-999999999999998 bg-[#00000080] flex items-center justify-center" />

          <div className="w-auto  min-h-[200px] min-w-[350px]  h-auto p-[23px] flex-col items-end justify-center bg-[#f8f8f8] fixed rounded-[10px]  z-[9999999999999999] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              onClick={() => {
                // Seller re-auth: the guest token was already re-registered when
                // the widget opened, so a dismissal just sends the seller home
                // instead of clearing tokens and reloading the dashboard.
                const isSeller =
                  shouldAuthinticated === "seller" ||
                  window.location.pathname.includes("/seller");
                setReAuthResult("cancelled");
                setShouldAuthinticated(false);
                if (isSeller) {
                  window.location.href = "/";
                  return;
                }
                // Clear sub-service tokens via server route
                fetch("/api/auth/clear-tokens", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tokens: ["CHAT-TOKEN", "STORIES-TOKEN"],
                  }),
                  credentials: "include",
                });
                copyInitialData();
                window.location.reload();
              }}
              className="flex-row cursor-pointer justify-end items-center p-[10px] z-99999999999 rounded-full  bg-[#0000004d]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16.411"
                height="16.411"
                viewBox="0 0 16.411 16.411"
              >
                <g
                  id="Group_10735"
                  data-name="Group 10735"
                  transform="translate(-1293.141 -97.641)"
                >
                  <line
                    id="Line_792"
                    data-name="Line 792"
                    x2="20.848"
                    transform="matrix(0.695, -0.719, 0.719, 0.695, 1294.105, 113.345)"
                    fill="none"
                    stroke="#f3f3f3"
                    strokeLinecap="round"
                    strokeWidth="1"
                  />
                  <line
                    id="Line_793"
                    data-name="Line 793"
                    x2="20.848"
                    transform="matrix(0.719, 0.695, -0.695, 0.719, 1293.849, 98.605)"
                    fill="none"
                    stroke="#f3f3f3"
                    strokeLinecap="round"
                    strokeWidth="1"
                  />
                </g>
              </svg>
            </div>

            <button
              onClick={copyInitialData}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium"
            >
              Copy Data
            </button>

            <ConfirmMobile
              closeWindow={() => {
                setShouldAuthinticated(false);
              }}
              // @ts-ignore
              hasMobile={
                userData?.phone !== null &&
                (userData as any)?.phone !== 0 &&
                userData?.phone !== "0"
              }
              goToOrders={() => {
                // equal to success flag when goToOrders trigrred then it means the verification success

                if (shouldAuthinticated === "open Story") {
                  setAddStory(true);
                }
                if (shouldAuthinticated === "open chat") {
                  ChatConroller(true);
                }
                setShouldAuthinticated(false);
              }}
            />
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

export default ConfirmMobilePhoneWidget;
