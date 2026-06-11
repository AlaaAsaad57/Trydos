import React from "react";
import { SellerProfileProvider } from "./SellerProfileContext";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-auto flex flex-col max-w-[1366px] min-h-screen bg-[#fafafa] p-4 lg:p-6 text-[#3c3c3c]">
      <SellerProfileProvider>{children}</SellerProfileProvider>
    </div>
  );
}

export default layout;
