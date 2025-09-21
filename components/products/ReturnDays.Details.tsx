"use client";
import Skeleton from "react-loading-skeleton";
import React from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";

function ReturnDaysDetails({ days, languageVariable }) {
  const { settings } = useAppStore();
  return (
    <span className="text-[#1d1d1d] regular text-[9px]">
      {translateFunction("within", languageVariable)}
      {settings ? (
        (settings?.["starting-setting"]?.shipping_duration_days || 0) + days
      ) : (
        <Skeleton width={20} height={14} />
      )}
      {translateFunction(
        "Days After Receiving The Product, You Can Return It Without Conditions Or Reasons With Complete Ease And Get The Amount Back",
        languageVariable
      )}
      <span className="meduim text-[#388CFF] px-[4px]">
        {translateFunction("get the Amount back", languageVariable)}
      </span>
    </span>
  );
}

export default ReturnDaysDetails;
