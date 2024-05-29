"use client";
import React, { useEffect } from "react";
import HomeService from "services/home";
function Init() {
  var bool = true;
  useEffect(() => {
    if (bool) {
      bool = false;
      setTimeout(() => {
        HomeService.RegisterDevice();
        HomeService.CheckLogin();
      }, 2000);
    }
  }, []);
  return <></>;
}

export default Init;
