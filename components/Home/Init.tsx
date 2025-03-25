"use client";
import React, { useEffect } from "react";
import HomeService from "services/home";
import { store } from "store";
function Init() {
  var bool = true;
  useEffect(() => {
    if (bool) {
      bool = false;

      HomeService.CheckLogin();
    }
    // @ts-ignore
    window.store = store;
  }, []);
  return <></>;
}

export default Init;
