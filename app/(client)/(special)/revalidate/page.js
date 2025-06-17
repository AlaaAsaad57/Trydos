"use client";
import Revalidate from "../../../revalidate";
import { useEffect } from "react";
export const runtime = "nodejs";

function Page() {
  useEffect(() => {
    revalidate();
  }, []);
  const revalidate = async () => {
    await Revalidate();
  };
  return <div></div>;
}

export default Page;
