"use client";
import React from "react";
import ShareIcon from "public/svg/listing/shareIcon.svg";

function ShareBoutiquePageButton() {
  return (
    <div
      data-cy="share_ortion"
      className="filter-option"
      onClick={() => {
        let url = document.location.href;

        if (typeof navigator !== "undefined") {
          navigator.clipboard.writeText(url).then(
            function () {},
            function () {}
          );
        }
      }}
    >
      <ShareIcon data-cy="share_ortion_svg" />
    </div>
  );
}

export default ShareBoutiquePageButton;
