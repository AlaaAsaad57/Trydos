import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UpdateName } from "store/auth/actions";
import { translate } from "utils/functions";
function NameModal() {
  const Open = useSelector((state) => state.chat.nameModal);
  const language = useSelector((state) => state.homepage.language);
  const [value, setValue] = useState("");
  const dispatch = useDispatch();
  const close = () => {
    dispatch({ type: "SHOW-MODAL", payload: false });
  };
  return (
    <div
      className={`lang-modalDisable ${Open && "open"}`}
      onClick={() => close()}
    >
      <div
        className="app"
        style={{
          position: "fixed",
          zIndex: "999999999",
          width: "300px",
          height: "200px",
          top: "50%",
          right: "0",
          left: "0",
          margin: "o auto",
          padding: "10px",
          borderRadius: "15px",
        }}
      >
        <input
          className="login-phone-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
        {value.length > 0 && (
          <button className="btn btn-success" onClick={() => UpdateName(value)}>
            {translate("OK", language)}
          </button>
        )}
      </div>
    </div>
  );
}

export default NameModal;
