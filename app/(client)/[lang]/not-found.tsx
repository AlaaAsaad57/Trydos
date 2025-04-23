"use client";
import Link from "next/link";
import { useEffect } from "react";
import { dispatchRouteChangeEvent } from "utils/events";

export default function NotFound() {
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
  }, []);
  return (
    <>
      {/* @ts-ignore*/}

      <div className="w-full items-center flex-col justify-around  h-full ">
        <h2 className="text-[#5d5d5d] text-[18px] light">404 - Not Found</h2>
        <p className="mt-[30px] text-[#5d5d5d] text-[18px] light ">
          Could not find requested resource for this URL
        </p>
        <Link
          href="/"
          className="mt-[30px] text-[#FEFEFE] text-[18px] medium cursor-pointer  flex-col w-full  rounded-[20px] text-center justify-center items-center bg-[#3C3C3C] h-[70px]"
        >
          Back To Home
        </Link>
      </div>
    </>
  );
}
