"use client";
import React, { useState } from "react";
import ShippingIcon from "public/svg/product/ShippingIcon.svg";
import ShippingDollar from "public/svg/product/ShippingDollar.svg";
import FastIcon from "public/svg/product/FastIcon.svg";
import PlaneIcon from "public/svg/product/PlaneIcon.svg";
import PackingIcon from "public/svg/product/PackingIcon.svg";
import MarkerIcon from "public/svg/product/MarkerIcon.svg";
import { Sendevent } from "utils/functions";
function ProductShippingOption() {
  const [extended, setExtended] = useState(false);
  return (
    <div
      className={`product-shipping product-colors product-sizes flex-col align-start relative ${
        extended && "extended-address-bar"
      }`}
      onClick={() => {
        Sendevent({ event: "button_clicked", value: "at_your_address_button" });
        setExtended(!extended);
      }}
    >
      <div className="colors-label flex-row align-center">
        <ShippingIcon />
        <span style={{ marginLeft: "5px" }}>Product Shipping & Delivery</span>
      </div>
      <div className="address-container flex-row justify-center align-center">
        <div className="address-info flex-row align-center justify-center">
          At Your Address In <span> Lebanon </span> Expected Within
          <span> 4 Days </span>
        </div>
      </div>
      <div
        className={`extended-address-info flex-col ${
          extended && "enable-address-info"
        }`}
      >
        <div className="address-info-row flex-row align-center">
          <PackingIcon />
          <div className="flex-col address-row-desc justify-center">
            <div className="flex-row align-center">
              <FastIcon />{" "}
              <span className="blue-address">
                Fast Packing & Start Shipping
              </span>
            </div>
            <span className="gray-address">
              Same Day Packing & Ship If Buy Before <span>13:00</span> Today
            </span>
          </div>
        </div>
        <div className="address-info-row flex-row align-center">
          <PlaneIcon />
          <div className="flex-col address-row-desc justify-center">
            <div className="flex-row align-center">
              <span className="blue-address">12. Jun. In Lebanon</span>
            </div>
            <span className="gray-address">
              Time Is Expected, It May Take More Or Less Than 2 Days
            </span>
          </div>
        </div>
        <div className="address-info-row flex-row align-center">
          <MarkerIcon />
          <div className="flex-col address-row-desc justify-center">
            <div className="flex-row align-center">
              <span className="blue-address">14. Jun. In Your Address</span>
            </div>
            <span className="gray-address">
              Specify Your Address To Calculate The Delivery Time
            </span>
          </div>
        </div>
      </div>
      <div className="green-label flex-row align-center">
        <div className="colors-label flex-row align-center ">
          <ShippingDollar />

          <span style={{ marginLeft: "20px" }}>
            You Will Get A <span>25% Refund</span> Of The Product Price If
            Shipping Is Delayed
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductShippingOption;
