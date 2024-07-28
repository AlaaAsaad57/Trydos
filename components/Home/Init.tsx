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
      }, 6000);
      setTimeout(() => {
        HomeService.CheckLogin();
      }, 1000);
    }
  }, []);
  return <></>;
}

export default Init;
