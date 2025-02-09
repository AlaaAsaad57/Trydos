"use client";
import SettingsModal from "components/Home/SettingsModal";
import React, { useState } from "react";

function Setting() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SettingsModal
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </>
  );
}

export default Setting;
