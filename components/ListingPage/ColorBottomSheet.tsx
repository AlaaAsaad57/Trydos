"use client";
import BottomSheet from "components/global/BottomSheet";
import ProductColorCard from "components/products/ProductColorCard";
import { useParams } from "node_modules/next/navigation";
import React from "react";
import { useAppStore } from "store";

function ColorBottomSheet() {
  const params = useParams();
  const { currency } = useAppStore();
  const { ColorBottomSheet, setColorBottomSheet } = useAppStore();

  return (
    <>
      {ColorBottomSheet && (
        <BottomSheet
          key={ColorBottomSheet?.product_id}
          isOpen={ColorBottomSheet}
          onClose={() => {
            document
              .querySelector(`#${ColorBottomSheet?.slug}`)
              .setAttribute(
                "href",
                `/${params.lang}/products/${ColorBottomSheet?.slug}`
              );
            setColorBottomSheet(false);
          }}
        >
          <div className="w-full pb-[40px] max-w-[406px] mx-auto  min-h-[80vh]  bg-white pt-[10px] flex-row flex-wrap gap-[6px] gap-y-[18px]">
            {ColorBottomSheet?.sync_color_images?.map((color, i) => (
              <ProductColorCard
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
