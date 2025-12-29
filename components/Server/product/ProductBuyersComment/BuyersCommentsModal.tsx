"use client";
import BuyersCommentModal from "components/products/BuyersCommentModal";

import { useAppStore } from "store";

function BuyersCommentsModal({ children, offset, filters_key }) {
  const { ColorBottomSheet } = useAppStore();
  return (
    <>
      {ColorBottomSheet && ColorBottomSheet?.is_buyers_comments && (
        <BuyersCommentModal offset={offset} filters_key={filters_key}>
          {children}
        </BuyersCommentModal>
      )}
    </>
  );
}

export default BuyersCommentsModal;
