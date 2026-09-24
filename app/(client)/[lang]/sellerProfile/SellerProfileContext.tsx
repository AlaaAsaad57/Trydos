"use client";
import React, { createContext, useContext, useState } from "react";

interface SellerProfileContextType {
  sellerData: any; // Define a proper type based on your data structure
  setSellerData: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  shopes: Array<{
    seller_id: number;
    shop_name: string;
    shop_role: string;
    permissions: Array<string>;
  }>;
  setShopes: React.Dispatch<
    React.SetStateAction<
      Array<{
        seller_id: number;
        shop_name: string;
        permissions: Array<string>;
      }>
    >
  >;
  sellerProducts?: any[];
  setSellerProducts?: React.Dispatch<React.SetStateAction<any[]>>;
  sellerBoutiques?: any[];
  setSellerBoutiques?: React.Dispatch<React.SetStateAction<any[]>>;
  sellerPermissions?: string[];
  setSellerPermissions?: React.Dispatch<React.SetStateAction<string[]>>;
}

const SellerProfileContext = createContext<
  SellerProfileContextType | undefined
>(undefined);

export const SellerProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sellerData, setSellerData] = useState({
    name: "",
    avatar: "",
    stats: {
      totalProducts: 0,
      totalPurchases: 0,
      interactions: {
        day: 0,
        month: 0,
      },
    },
  });
  // Starts TRUE, not false. Every consumer's first paint happens before its
  // fetch effect runs, so a `false` start makes the shop list paint an empty
  // grid — and the dashboard paint "No products found" — for one frame before
  // the request has even been made. Starting in the loading position means the
  // placeholder is what shows first, and the empty state can only be reached
  // once a request has actually come back. See spec AC-9.
  const [loading, setLoading] = useState(true);
  const [shopes, setShopes] = useState<any[]>([]);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerBoutiques, setSellerBoutiques] = useState<any[]>([]);
  const [sellerPermissions, setSellerPermissions] = useState<string[]>([]);
  return (
    <SellerProfileContext.Provider
      value={{
        sellerData,
        setSellerData,
        loading,
        setLoading,
        shopes,
        setShopes,
        sellerProducts,
        setSellerProducts,
        sellerBoutiques,
        setSellerBoutiques,
        sellerPermissions,
        setSellerPermissions,
      }}
    >
      {children}
    </SellerProfileContext.Provider>
  );
};

export const useSellerProfile = () => {
  const context = useContext(SellerProfileContext);
  if (!context) {
    throw new Error(
      "useSellerProfile must be used within a SellerProfileProvider"
    );
  }
  return context;
};
