"use client";
import { useRouter } from "next-nprogress-bar/dist";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import React, { useEffect } from "react";
import { Sendevent } from "utils/functions";

function PrefetchLink({ link, slug }) {
  useEffect(() => {
    let element = document.querySelector(`#boutique-${slug}`);
    if (element) {
      element.addEventListener("click", function () {
        Sendevent({
          event: "button_clicked",
          value: "choose_boutique_button",
        });
      });
    }
    return () =>
      element.removeEventListener("click", function () {
        Sendevent({
          event: "button_clicked",
          value: "choose_boutique_button",
        });
      });
  }, []);
  return <></>;
}

export default PrefetchLink;
