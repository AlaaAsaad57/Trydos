"use client";
import { useEffect } from "react";

function ClientLogger({ value }) {
  useEffect(() => {
    console.log("Client Logger:", value);
  }, []);
  return <></>;
}

export default ClientLogger;
