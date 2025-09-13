"use client";
import "styles/listing.css";
import BottomSheet from "components/global/BottomSheet";
import ProductColorCard from "components/products/ProductColorCard";
import { useParams } from "node_modules/next/navigation";
import React from "react";
import { useAppStore } from "store";

function ColorBottomSheet({ id, setActiveColor, activeColor }) {
  const params = useParams();
  const { currency } = useAppStore();
  const { ColorBottomSheet, setColorBottomSheet } = useAppStore();

  if (ColorBottomSheet?.product_id !== id) return <></>;
  else
    return (
      <>
        {ColorBottomSheet && ColorBottomSheet?.sync_color_images && (
          <BottomSheet
            key={ColorBottomSheet?.product_id}
            isOpen={ColorBottomSheet}
            onClose={() => {
              setColorBottomSheet(false);
            }}
          >
            <div className="w-full pb-[40px] max-w-[1310px] min-h-[60vh] bg-white pt-[10px] flex flex-wrap gap-y-[18px] gap-x-[4px] justify-center items-center">
              {ColorBottomSheet?.sync_color_images?.map((color, i) => (
                <ProductColorCard
                  onClick={() => {
                    setActiveColor(color);
                  }}
                  Sliders={false}
                  key={`${color?.color_name}:${i}`}
                  product={{
                    ...ColorBottomSheet,
                    sync_color_images: [color],
                    images: color.images,
                  }}
                  params={params}
                  currency={currency}
                  productColor={color}
                />
              ))}
            </div>
          </BottomSheet>
        )}
      </>
    );
}

export default ColorBottomSheet;
