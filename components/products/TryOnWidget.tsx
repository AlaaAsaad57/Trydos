"use client";

import React, { useState } from "react";
import TryOnModal from "./TryOnModal";

interface TryOnWidgetProps {
  language: string;
  product: any;
  setIsModalOpen: (e: boolean) => void;
  isModalOpen: any;
}

const TryOnWidget: React.FC<TryOnWidgetProps> = ({
  language,
  product,
  isModalOpen,
  setIsModalOpen,
}) => {
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <TryOnModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        language={language}
      />
    </>
  );
};

export default TryOnWidget;
