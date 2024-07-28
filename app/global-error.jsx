"use client";
import { useEffect } from "react";
import Logo from "../components/Home/Logo";
export default function GlobalError({ error, reset }) {
  const baseUrl = "https://market_staging.trydos.tech/api/new_v1";
  const _getUserAgent = async () => {
    return navigator.userAgent || "";
  };
  const sendError = async () => {
    const userAgent = await _getUserAgent();
    let last_json;
    let token;
    if (typeof window !== "undefined") {
      last_json = (await localStorage.getItem("LAST_JSON"))
        ? JSON.parse(localStorage.getItem("LAST_JSON"))
        : null;
      token = (await localStorage.getItem("USER-CHAT"))
        ? JSON.parse(localStorage.getItem("USER-CHAT")).access_token
        : null;
    }
    let axios = (await import("axios")).default;
    axios.post(`${baseUrl}/mobile_error_log/store`, {
      error_description: error.message,
      last_json,
      token,
      userAgent,
      url: location.href,
    });
  };
  useEffect(() => {
    sendError(error);
  }, [error]);
  return (
    <html lang="en" className="">
      <body>
        <div className="flex justify-start flex-col items-center p-[50px]">
          <div>
            <Logo style={true} />
          </div>
          <div className="flex flex-row items-center;">
            <h1 className="text-[red]">Error:</h1>
            <h2 className="p-5">{error.message}</h2>
          </div>

          <button
            className="w-[300px] flex text-center justify-center items-center bg-[aliceblue] p-5 rounded-[15px]"
            onClick={() => (window.location.href = "/")}
          >
            Go Back
          </button>
        </div>
      </body>
    </html>
  );
}
