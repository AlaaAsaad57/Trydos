"use client";
import { useState } from "react";
import { OverlayForClose } from "./OverlayForCLose";
import { useAppStore } from "store";
import ShareButton from "components/products/ShareButton";
import AddToCartButton from "components/products/AddToCartButton";
import ProductLikeButton from "./ProductLikeButton";
import ProductCommentButton from "./ProductCommentButton";
import ProductShareButton from "./ProductShareButton";
import ProductMoreButton from "./ProductMoreButton";
import ExtendedAreaInfo from "components/products/ExtendedAreaInfo";

function ProductFooter({ isRtl, productLightData }) {
  const { loginOpen, selectedContactsForShare, setSelectedContactsForShare } =
    useAppStore();
  let [activeTab, setActiveTab] = useState<string | boolean>(false);

  if (loginOpen) return <></>;
  return (
    <>
      {activeTab && (
        <OverlayForClose
          close={() => {
            setSelectedContactsForShare([]);
            setActiveTab(false);
          }}
        />
      )}
      {/* Tabs Content  */}
      <ExtendedAreaInfo
        product_data={productLightData}
        active={Boolean(activeTab)}
        option={activeTab}
      />
      <div
        className={`product-options-container ${isRtl && "flex-row-reverse"}`}
        style={{ zIndex: "999999999" }}
      >
        {selectedContactsForShare?.length > 0 ? (
          <ShareButton
            Image={productLightData?.image}
            brand={productLightData.brand}
            category={productLightData.category}
            close={() => {
              setActiveTab(false);
            }}
            details={productLightData.details}
            id={productLightData.id}
            name={productLightData.name}
            price={productLightData?.offer_price}
            slug={productLightData?.slug}
            boutique_id={productLightData?.boutique_id}
          />
        ) : (
          <div
            className={`options-container relative w-full  justify-between flex flex-row pb-[35px] pt-[8px] h-[68px] px-[20px] ${
              isRtl && "flex-row-reverse"
            }`}
            data-cy="InteraCtionBoX"
          >
            <AddToCartButton product={productLightData} />
            <div
              className={`flex justify-between w-full ${
                isRtl && "flex-row-reverse"
              }`}
            >
              <ProductLikeButton
                total_likes={productLightData.total_likes}
                isLiked={productLightData.is_liked}
                productId={productLightData.id}
                brand={productLightData.brand?.name}
                brand_id={productLightData.brand?.id}
                category={productLightData.category?.name}
                category_id={productLightData.category?.id}
                name={productLightData.name}
                price={productLightData?.offer_price}
              />
              <ProductCommentButton
                productId={productLightData?.id}
                total_comments={productLightData?.total_comments}
                isActive={activeTab === "Comment"}
                setActive={() => {
                  setActiveTab("Comment");
                }}
              />
            </div>
            <div className="min-w-[130px]" />
            <div
              className={`${
                isRtl && "flex-row-reverse"
              } flex justify-between w-full`}
            >
              <ProductShareButton
                total_shares={productLightData?.total_shares}
                Active={activeTab === "shares"}
                setActive={() => {
                  setActiveTab("shares");
                }}
              />
              <ProductMoreButton
                Active={activeTab === "More"}
                setActive={() => {
                  setActiveTab("More");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ProductFooter;
