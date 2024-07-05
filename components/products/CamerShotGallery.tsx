"use client";
import React, { useEffect, useState } from "react";
import BackBar from "./BackBar";

function CamerShotGallery({ active, images, close }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(
        ".images-slider-gallery"
      );
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mouseup", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);
  const [activeImage, setImage] = useState(images[0]);
  return (
    <>
      <div
        className={`gallery-camerashot w-100 flex-col fixed justify-between ${
          active && "slide-gallery"
        }`}
      >
        <BackBar
          close={() => {
            close();
            document.documentElement.style.overflow = "auto";
          }}
          link={false}
        />
        {
          <>
            <div className="image-preview">
              <img width={"100%"} src={activeImage} />
            </div>
            <div className="images-slider-gallery flex-row">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  width={86}
                  height={125}
                  onClick={() => setImage(image)}
                />
              ))}
            </div>
          </>
        }
      </div>
    </>
  );
}

export default CamerShotGallery;
