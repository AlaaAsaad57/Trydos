"use client";
import Logo from "../components/Home/Logo";
export default function GlobalError({ error, reset }) {
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
