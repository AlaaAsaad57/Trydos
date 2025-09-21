"use client";
import React, { useEffect } from "react";

function DataSourceLogger({ dataSourceString }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DATASOURCE_LOG === "true")
      console.log(`🛑🛑 ${dataSourceString} 🛑🛑`);
  }, []);
  return <></>;
}

export default DataSourceLogger;
