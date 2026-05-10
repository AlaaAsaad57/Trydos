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
    name: "John Doe",
    avatar: "https://placehold.co/72x72",
    stats: {
      totalProducts: 124,
      totalPurchases: 856,
      interactions: {
        day: 45,
        month: 1234,
      },
    },
  });
  const [loading, setLoading] = useState(false);
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
