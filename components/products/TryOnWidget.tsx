"use client";

import TryOnModal from "./TryOnModal";

const TryOnWidget = ({ language, product, isModalOpen, setIsModalOpen }) => {
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
