"use client";
import Revalidate from "../../revalidate";
import React, { useEffect } from "react";

function Page() {
  useEffect(() => {
    revalidate();
  }, []);
  const revalidate = async () => {
    await Revalidate();
  };
  return <div>page</div>;
}

export default Page;
