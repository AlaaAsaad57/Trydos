import React from "react";
import { SellerProfileProvider } from "./SellerProfileContext";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-auto flex flex-col max-w-[1366px] min-h-screen bg-gray-50 p-6 text-[#1d1d1d]">
      <SellerProfileProvider>{children}</SellerProfileProvider>
    </div>
  );
}

export default layout;
