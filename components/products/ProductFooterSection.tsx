"use client";
import React, { useState } from "react";
import ExtendedAreaInfo from "./ExtendedAreaInfo";
import ProductOptions from "./ProductOptions";
import { translateFunction } from "utils/functions";
import chat from "services/chat";
import { useParams, useSearchParams } from "next/navigation";
import auth from "services/auth";
import LocalizationServiceClass from "services/localization";
import { useAppStore } from "store";
import { ProductFooterSectionPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import { showErrorNotification } from "@/store/notifications/reducer";

import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";

function ProductFooterSection({
  total_likes,
  total_shares,
  total_comments,
  Image,
  slug,
  id,
  name,
  details,
  price,
  brand,
  category_id,
  category,
  brand_id,
}) {
  const {
    setShareLoading,

    loginOpen,

    SelectedProduct,
  } = useAppStore();
  let { lang } = useParams();

  // @ts-ignore
  let [country, languageVariable] = lang.split("-");
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };

  const [option, setOption] = useState("");

  const [sharedContacts, setShareContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const shareAction = () => {
    if (sharedContacts.length > 0) {
      const messageShare = {
        product_id: id,
        product_image_url: Image,
        product_name: name,
        product_slug: slug,
        product_description: details,
      };
      setShareLoading(true);
      chat.ShareProduct({
        userId: sharedContacts,
        product: messageShare,
        callback: () => {
          setShareLoading(false);
          setShareContacts([]);
          setOption("");
        },
      });

      GAevent({
        action: GA_EVENT_NAMES.SHARE_CONTENT,
        params: {
          content_id: id,
          item_id: id,
          item_name: name,
          user_id_custom: auth.UserID(),
          brand_id: brand_id,
          category: category,
          category_id: category_id,
          brand: brand,
          price: price,
          share_context: "internal",
          shared_from_page: window.location.pathname,
          screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
          screen_path: window.location.pathname,
          method_share: "chat_in_share",
        },
      });
    } else {
      showErrorNotification(
        translate(
          "please select one contact at least",
          LocalizationServiceClass.GetAppLanguage()
        )
      );
    }
  };

  return <></>;
}

export default ProductFooterSection;

const OverlayForClose = ({ close }) => {
  return (
    <div
      onClick={() => close()}
      className="absolute z-[99999999999] bottom-full bg-[rgba(0,0,0,0.2)] left-0 w-full h-screen"
      data-cy="close_extended_area"
    />
  );
};
