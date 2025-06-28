"use client";

import { useEffect } from "react";
import Logo from "components/Home/Logo";
import { LogError } from "utils/functions";
import { dispatchRouteChangeEvent } from "utils/events";
import AuthService from "services/auth";
import * as Sentry from "@sentry/nextjs";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const _getUserAgent = async () => {
    return navigator.userAgent || "";
  };
  const sendError = async (error: Error & { digest?: string }) => {
    Sentry.captureException(error);
    const userAgent = await _getUserAgent();
    let last_json;
    let token;
    let user_id;
    if (typeof window !== "undefined") {
      last_json = (await localStorage.getItem("LAST_JSON"))
        ? JSON.parse(localStorage.getItem("LAST_JSON"))
        : null;
      token = AuthService.UserToken();
      user_id = AuthService.UserID();
    }
    let errorObj = {
      type: "front-end-exception",
      message: error.message,
      url: window.location.href,
      user_id: user_id,
      token: token,
      user_agent: userAgent,
    };
    LogError(errorObj);
  };
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    sendError(error);
  }, [error]);
  if (
    error.message?.includes("Connection") ||
    error.message?.includes("chunks")
  ) {
    return (
      <html lang="en" className="">
        <body>
          <div className="site-container">
            <div className="flex justify-start flex-col items-center p-[50px] min-h-screen">
              <div>
                <Logo style={true} animated={false} />
              </div>
              <div className="flex flex-row items-center;">
                <h1 className="text-[red]">Error:</h1>
                <h2 className="p-5 text-[#5d5d5d]">
                  Connection Error Due to Network change or Slow Internet
                  Network Please Try again
                </h2>
              </div>
              <h2 className="p-5 text-[#5d5d5d]">{error.message}</h2>
              <button
                className="w-[300px] flex text-center justify-center items-center bg-[aliceblue] p-5 rounded-[15px]"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }
  return (
    <div className="site-container">
      <div className="flex justify-start flex-col items-center p-[50px] min-h-screen">
        <div>
          <Logo style={true} animated={false} />
        </div>
        <div className="flex flex-row items-center;">
          <h1 className="text-[red]">Error:</h1>
          <h2 className="p-5 text-[#5d5d5d]">{error.message}</h2>
        </div>

        <button
          className="w-[300px] flex text-center justify-center items-center bg-[aliceblue] p-5 rounded-[15px]"
          onClick={() => (window.location.href = "/")}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
