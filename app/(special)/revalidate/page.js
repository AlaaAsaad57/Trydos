"use client";
import Revalidate from "../../revalidate";
import { useEffect } from "react";

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
