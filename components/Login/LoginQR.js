import Border from "../global/Border";
import ScanIcon from "public/svg/ScanIcon.svg";
import QuestionIcon from "public/svg/questionIcon.svg";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import QRCode from "react-qr-code";
function LoginQR({ selectedMethod, selectMethod }) {
  const language = useSelector((state) => state.homepage.language);
  return (
    <div
      className="login-label-container"
      onClick={() => selectMethod()}
      style={{
        height: selectedMethod ? "332px" : "50px",
        marginTop: "10px",
        paddingTop: "15px",
        alignItems: "flex-start",
        cursor: "pointer",
      }}
    >
      <Border height={selectedMethod ? 332 : 50} />
      <div
        className="login-label login-extend"
        style={{
          height: selectedMethod ? "332px" : "50px",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        <div className="login-label-title">
          <ScanIcon className={selectedMethod && "active-login-icon"} />
          <div className={`${language + "-regular"}  login-label-text`}>
            {translate("By Scan Qr From Trydos App", language)}
          </div>
        </div>
        <div className="login-qr-section">
          {selectedMethod && (
            <>
              <div className="login-qr-info">
                <QuestionIcon style={{ transform: "scale(0.6666666)" }} />
                <div className={`${language + "-light"}  login-qr-info-text`}>
                  {translate(
                    "Scan This Qr Code From You Trydos App In Your Phone",
                    language
                  )}
                </div>
              </div>
              <div className="qr-element">
                <QRCode
                  size={200}
                  style={{ borderRadius: "20px" }}
                  value={"Test"}
                  level="H"
                  viewBox={`0 0 200 200`}
                  bo
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginQR;
