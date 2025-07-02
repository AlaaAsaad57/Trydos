import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import React from "react";
import DescriptorBorder from "public/svg/product/descriptorBorder.svg";
import { GetImageUrl } from "utils/tinyUtils";
function ProductDescriptors({ descriptors }) {
  return (
    <HortiznalScrollBar
      id="product-descriptors"
      className="flex-row product-descriptors-row"
    >
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
                src={GetImageUrl(descriptor.descriptor_group.icon)}
              />
            </div>
            <div className="descriptor-value flex-col">
              <div className="descriptor-name">
                {descriptor.descriptor_group.name}
              </div>
              <div className="descriptor-values flex-row">
                {descriptor?.descriptors?.map((sub_descriptor, index) => (
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
                        src={GetImageUrl(sub_descriptor.descriptor.icon)}
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
    </HortiznalScrollBar>
  );
}

export default ProductDescriptors;
