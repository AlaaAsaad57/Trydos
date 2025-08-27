import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import React from "react";
import { GetImageUrl } from "utils/tinyUtils";
function ProductDescriptors({ descriptors }) {
  return (
    <HortiznalScrollBar
      id="product-descriptors"
      className="flex-row product-descriptors-row h-[44px]"
    >
      {descriptors?.map((descriptor, key) => {
        return (
          <div
            key={key}
            className="flex-col product-descriptor relative align-start justify-center gap-[5px] bg-[#FCFCFC] w-auto h-full rounded-[15px] px-[13px]"
          >
            <div className="flex-row gap-[4px] items-center">
              <div className="descriptor-icon">
                <img
                  width={11}
                  height={11}
                  src={GetImageUrl(descriptor.descriptor_group.icon)}
                />
              </div>
              <div className="descriptor-name regular text-[9px] text-[#1d1d1d]">
                {descriptor.descriptor_group.name}
              </div>
            </div>
            <div className="descriptor-value m-0">
              <div className="descriptor-values flex-row">
                {descriptor?.descriptors?.map((sub_descriptor, index) => (
                  <div
                    className="sub-descriptor align-center flex-row text-[11px] text-[#1d1d1d] gap-[4px]"
                    key={index}
                  >
                    {index !== 0 && (
                      <span className="descriptor-separtor">|</span>
                    )}
                    {sub_descriptor.descriptor?.icon && (
                      <img
                        className="m-0"
                        width={10}
                        height={10}
                        alt={sub_descriptor.descriptor.name}
                        src={GetImageUrl(sub_descriptor.descriptor.icon)}
                      />
                    )}

                    {sub_descriptor.descriptor?.name && (
                      <span className="sub-descriptor-name regular m-0 text-[11px] text-[#1d1d1d]">
                        {sub_descriptor.descriptor?.name}
                      </span>
                    )}
                    <span className="desc-value regular text-[11px] m-0 text-[#1d1d1d]">
                      {sub_descriptor.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </HortiznalScrollBar>
  );
}

export default ProductDescriptors;
