"use client";
import { useEffect, useState } from "react";
import Logo from "../components/Home/Logo";
import "public/styles/error.css";
import axios from "axios";
export default function GlobalError({ error, reset }) {
  const baseUrl = "https://market_staging.trydos.tech/api/new_v1";
  const _getUserAgent = async () => {
    return navigator.userAgent || "";
  };
  const sendError = async () => {
    const userAgent = await _getUserAgent();
    console.log(userAgent, "userAgent");
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
    axios.post(`${baseUrl}/mobile_error_log/store`, {
      error_description: error.message,
      last_json,
      token,
      userAgent,
    });
  };
  useEffect(() => {
    sendError(error);
  }, [error]);
  return (
    <html>
      <body>
        <div className="error-page">
          <div>
            <Logo style={true} />
          </div>
          <div className="error-row">
            <h1 className="error-line">Error:</h1>
            <h2 className="error-padding-2">{error.message}</h2>
          </div>

          <button
            className="error-button"
            onClick={() => (window.location.href = "/")}
          >
            Go Back
          </button>
        </div>
      </body>
    </html>
  );
}
