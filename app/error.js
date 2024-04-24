"use client";
import Logo from "../components/Home/Logo";
import "public/styles/error.css";
export default function GlobalError({ error, reset }) {
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
