import React, { useState } from "react";

import AuthService from "services/auth";
import { translateFunction } from "utils/functions";

import Border from "./Border";

import "styles/Modal.css";
import { useAppStore } from "store";
import { pollinateInput } from "@/utils/tinyUtils";

function NameModal() {
  const { language, nameModal: Open, setNameModal } = useAppStore();

  const [value, setValue] = useState("");

  const close = () => {
    setNameModal(false);
  };
  return (
    <>
      <div
        className={`fixed inset-0 w-screen h-screen bg-black/30 z-9999999999998 ${
          Open && "open"
        }`}
        onClick={(e) => {
          close();
        }}
      ></div>

      <div
        className="app max-w-[280px] max-h-[140px] left-0 right-0 mx-auto my-0"
        style={{
          position: "fixed",

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
          className="flex regular"
          style={{ fontSize: "12px", color: "#5d5d5d" }}
        >
          {translateFunction("Enter Your Name", language)}
        </div>
        <div
          className="phone-input-element mt-3"
          style={{ height: "50px", padding: "12px" }}
        >
          <Border color={"#707070"} height={50} width={250} />
          <img
            src="/icons/manIcon.svg"
            style={{ width: "20px", position: "absolute" }}
          />
          <label htmlFor="phone" className="hidden">
            {translateFunction("Name")}
          </label>
          <input
            data-pw="Input-Name"
            className="login-phone-input absolute top-0 text-[12px] regular"
            style={{
              zIndex: "2",
              height: "50px",
              left: "35px",
              fontSize: "12px",
            }}
            value={value}
            onChange={(e) => {
              setValue(pollinateInput(e.target.value));
            }}
          />
          {value.length > 1 && (
            <img
              src="/icons/LeftArrowIcon.svg"
              style={{
                position: "absolute",
                right: "20px",
                top: "20px",
                zIndex: "3",
                cursor: "pointer",
              }}
              data-pw="Input-Name-Submit"
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
