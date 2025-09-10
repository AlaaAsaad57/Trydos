"use client";
import React from "react";
import { useAppStore } from "store";
import TryOnWidget from "./TryOnWidget";

function VirtualTryOnWrapper({ language }) {
  const { isModalOpen, setIsModalOpen } = useAppStore();
  if (!isModalOpen) return <></>;
  return (
    <TryOnWidget
      isModalOpen={isModalOpen}
      setIsModalOpen={(e) => setIsModalOpen(e)}
      language={language}
      product={isModalOpen}
    />
  );
}

export default VirtualTryOnWrapper;
