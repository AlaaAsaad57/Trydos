"use client";
import SettingsModal from "components/Home/SettingsModal";
import { useState } from "react";

function Setting({ lang }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SettingsModal
        onClose={() => {
          setIsModalOpen(false);
        }}
        lang={lang}
      />
    </>
  );
}

export default Setting;
