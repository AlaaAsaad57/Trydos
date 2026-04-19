"use client";
import BottomSheet from "components/global/BottomSheet";

import { useAppStore } from "store";

function ProductColorsBottomSheet({ children, id }) {
  const { ColorBottomSheet, setColorBottomSheet } = useAppStore();
  if (!ColorBottomSheet?.id || ColorBottomSheet?.id !== id) return null;
  return (
    <BottomSheet
      key={ColorBottomSheet?.product_id}
      isOpen={ColorBottomSheet}
      onClose={() => {
        setColorBottomSheet(false);
      }}
    >
      {children}
    </BottomSheet>
  );
}

export default ProductColorsBottomSheet;
