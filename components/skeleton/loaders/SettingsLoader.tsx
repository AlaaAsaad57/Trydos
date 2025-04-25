import Spinner from "components/global/Spinner";
import React from "react";

function SettingsLoader() {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed bg-[#fafafa] min-h-screen  flex-col    w-screen  overflow-hidden"
    >
      <span className="scale-[5]">
        <Spinner />
      </span>
    </div>
  );
}

export default SettingsLoader;
