"use client";
import { useEffect, useState } from "react";
import Logo from "../components/Home/Logo";
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
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            flexDirection: "column",
            alignItems: "center",
            padding: "50px",
          }}
        >
          <div>
            <Logo style={true} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <h1 style={{ color: "red" }}>Error:</h1>
            <h2 style={{ padding: "20px" }}>{error.message}</h2>
          </div>

          <button
            style={{
              padding: "20px",
              borderRadius: "15px",
              width: "300px",
              display: "flex",
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "aliceblue",
            }}
            onClick={() => (window.location.href = "/")}
          >
            Go Back
          </button>
        </div>
      </body>
    </html>
  );
}
