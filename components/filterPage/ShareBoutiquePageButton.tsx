"use client";
import React from "react";
import ShareIcon from "public/svg/listing/shareIcon.svg";

function ShareBoutiquePageButton() {
  return (
    <div
      className="filter-option"
      onClick={() => {
        let url = document.location.href;

        navigator.clipboard.writeText(url).then(
          function () {},
          function () {}
        );
      }}
    >
      <ShareIcon />
    </div>
  );
}

export default ShareBoutiquePageButton;
