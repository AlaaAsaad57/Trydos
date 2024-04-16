import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthService from "services/auth";
import { translate } from "utils/functions";
import ManIcon from "public/svg/manIcon.svg";
import Border from "./Border";
import LeftArrowIcon from "public/svg/LeftArrowIcon.svg";

function NameModal() {
  const Open = useSelector((state: any) => state.chat.nameModal);
  const language = useSelector((state: any) => state.homepage.language);
  const [value, setValue] = useState("");
  const dispatch = useDispatch();
  const close = () => {
    dispatch({ type: "SHOW-MODAL", payload: false });
  };
  return (
    <>
      <div
        className={`lang-modalDisable ${Open && "open"}`}
        onClick={(e) => {
          close();
        }}
      ></div>

      <div
        className="app"
        style={{
          position: "fixed",
          zIndex: "999999999",
          width: "280px",
          height: "140px",
          top: "50%",
          right: "0",
          left: "0",
          margin: "0 auto",
          background: "#FAFAFA",
          padding: "10px",
          borderRadius: "15px",
        }}
      >
        <div
          className="phone-input-element"
          style={{ height: "50px", fontSize: "12px", color: "#5d5d5d" }}
        >
          {translate("Enter Your Name", language)}
        </div>
        <div
          className="phone-input-element"
          style={{ height: "50px", padding: "12px" }}
        >
          <Border color={null} height={50} width={250} />
          <ManIcon style={{ width: "20px" }} />
          <label htmlFor="phone" className="no-label">
            Name
          </label>
          <input
            className="login-phone-input"
            style={{ zIndex: "2" }}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
          {value.length > 1 && (
            <LeftArrowIcon
              style={{
                position: "absolute",
                right: "20px",
                top: "20px",
                zIndex: "3",
                cursor: "pointer",
              }}
              onClick={() => {
                AuthService.UpdateName(value);
                close();
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default NameModal;
