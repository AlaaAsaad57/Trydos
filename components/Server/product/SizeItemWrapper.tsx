"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

function SizeItemWrapper({ children, ActiveSize }) {
  const [activeSize, setActiveSize] = useState(ActiveSize);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      {children.map((child) => (
        <div
          key={child?.key}
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("size", child?.key);
            router.push(pathname + `?${newParams.toString()}`, {
              // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
              shallow: true,
              scroll: false,
            });
            setActiveSize(child?.key);
          }}
          className={`uppercase justify-center cursor-pointer rounded-[6px] flex-col  w-auto h-[46px]  min-w-[50px] items-center px-[6px] ${
            child?.key === activeSize ? "bg-[#F4F4F4]" : "bg-white"
          } text-[#1d1d1d] text-[11px]`}
          style={{
            border: "1px solid #D3D3D37f",
          }}
        >
          {child}
        </div>
      ))}
    </>
  );
}

export default SizeItemWrapper;
