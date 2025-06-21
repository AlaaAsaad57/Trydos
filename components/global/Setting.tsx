"use client";
import SettingsModal from "components/Home/SettingsModal";
import { SettingComponentPropsType } from "models/componentType/settingsType/SettingComponentPropsType";
import React, { useState } from "react";

function Setting({ lang }: SettingComponentPropsType) {
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
