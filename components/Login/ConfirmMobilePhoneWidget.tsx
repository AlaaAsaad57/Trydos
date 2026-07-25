import ConfirmMobile from "components/Cart/ConfirmMobile";
import React, { useEffect } from "react";
import { useAppStore } from "store";
import { ChatConroller, DisableScroll, EnableScroll } from "utils/tinyUtils";
import {
  ORDER_EVENTS,
  resolveVerifyFlowSource,
  trackOrder,
} from "utils/orderFunnel";
import { createPortal } from "react-dom";

function ConfirmMobilePhoneWidget() {
  const {
    setShouldAuthinticated,
    shouldAuthinticated,
    setAddStory,
    openChat,
    setReAuthResult,
  } = useAppStore();
  // Capture the source the verify widget was opened from once, at mount — the
  // store marker is cleared to `false` the moment verification succeeds.
  const flowSourceRef = React.useRef(
    resolveVerifyFlowSource(shouldAuthinticated),
  );
  useEffect(() => {
    DisableScroll();
    trackOrder(ORDER_EVENTS.VERIFY_FLOW_OPENED, {
      flow_source: flowSourceRef.current,
    });

    return () => {
      EnableScroll();
    };
  }, []);
  const userData = useAppStore.getState().userProfile;

  return (
    <>
      {createPortal(
        <>
          <div className="fixed top-0 left-0 w-screen h-screen z-999999999999998 bg-[#00000080] flex items-center justify-center" />

          <div className="w-auto  min-h-[200px] min-w-[350px]  h-auto p-[23px] flex-col items-end justify-center bg-[#f8f8f8] fixed rounded-[10px]  z-[9999999999999999] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              onClick={(e) => {
                // Dismissal without verifying: seller routes redirect home (a
                // guest can't use the dashboard); every other flow/route
                // reloads so the page re-renders against whatever token is
                // currently stored — never against stale client state.
                // The navigation is the one guaranteed step: every bit of
                // teardown is best-effort and must never prevent it (a store
                // write can re-render subscribers synchronously — a throw
                // there would otherwise kill this handler before the reload).
                e.stopPropagation();
                const isSeller =
                  shouldAuthinticated === "seller" ||
                  window.location.pathname.includes("/seller");
                // Clear sub-service tokens via server route. keepalive lets
                // the request survive the navigation below. Skipped when
                // opened from the session-expired prompt — /api/auth/expire
                // already cleared them.
                if (shouldAuthinticated !== "expired-login") {
                  try {
                    fetch("/api/auth/clear-tokens", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        tokens: ["CHAT-TOKEN", "STORIES-TOKEN"],
                      }),
                      credentials: "include",
                      keepalive: true,
                    });
                  } catch {}
                }
                try {
                  setReAuthResult("cancelled");
                  setShouldAuthinticated(false);
                } catch {}
                if (isSeller) {
                  window.location.href = "/";
                } else {
                  window.location.reload();
                }
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

                // Verification succeeded; if this flow was opened from the
                // checkout gate, the user is being returned to checkout.
                if (flowSourceRef.current === "checkout") {
                  trackOrder(
                    ORDER_EVENTS.VERIFY_COMPLETED_RETURNED_TO_CHECKOUT,
                    { flow_source: flowSourceRef.current },
                  );
                }
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
