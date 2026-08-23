"use client";

import { useEffect } from "react";
import Logo from "components/Home/Logo";
import { LogError, translateFunction } from "utils/functions";
import AuthService from "services/auth";
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const _getUserAgent = async () => {
    return typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  };
  const sendError = async (error: Error & { digest?: string }) => {
    const userAgent = await _getUserAgent();
    let last_json;
    let token;
    let user_id;
    if (typeof window !== "undefined") {
      last_json = (await localStorage.getItem("LAST_JSON"))
        ? JSON.parse(localStorage.getItem("LAST_JSON"))
        : null;
    }

    user_id = AuthService.UserID();
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
    sendError(error);
  }, [error]);
  return (
    <html lang="en" className="">
      <body>
        <div className="flex justify-start flex-col items-center p-[50px]">
          <div>
            <Logo style={true} animated={false} />
          </div>
          <div className="flex flex-row items-center;">
            <h1 className="text-[red]">{translateFunction("Error:")}</h1>
            <h2 className="p-5 text-[#5d5d5d]">{error.message}</h2>
          </div>

          <button
            className="w-[300px] flex text-center justify-center items-center bg-[aliceblue] p-5 rounded-[15px]"
            onClick={() => (window.location.href = "/")}
          >
            {translateFunction("Go Back")}
          </button>
        </div>
      </body>
    </html>
  );
}
