"use client";
import React, { useEffect } from "react";
import DescriptorBorder from "public/svg/product/descriptorBorder.svg";
function ProductDescriptors({ descriptors }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(
        ".product-descriptors-row"
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
  return (
    <div className="flex-row product-descriptors-row">
      {descriptors?.map((descriptor, key) => {
        return (
          <div
            key={key}
            className="flex-row product-descriptor relative align-center"
          >
            <DescriptorBorder className="descriptor-border absolute" />
            <div className="descriptor-icon">
              <img
                width={20}
                height={20}
                src={descriptor.descriptor_group.icon}
              />
            </div>
            <div className="descriptor-value flex-col">
              <div className="descriptor-name">
                {descriptor.descriptor_group.name}
              </div>
              <div className="descriptor-values flex-row">
                {descriptor.descriptors.map((sub_descriptor, index) => (
                  <div
                    className="sub-descriptor align-center flex-row"
                    key={index}
                  >
                    {index !== 0 && (
                      <span className="descriptor-separtor">|</span>
                    )}
                    <span className="desc-value">{sub_descriptor.value}</span>
                    {sub_descriptor.descriptor?.icon && (
                      <img
                        width={15}
                        height={15}
                        alt={sub_descriptor.descriptor.name}
                        src={sub_descriptor.descriptor.icon}
                      />
                    )}
                    {sub_descriptor.descriptor?.name && (
                      <span className="sub-descriptor-name">
                        {sub_descriptor.descriptor?.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProductDescriptors;
