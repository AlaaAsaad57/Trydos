"use client";
import React from "react";
import { useAppStore } from "store";

function ProductColorsWrapper({
  children,
  product,
}: {
  children: React.ReactNode;
  product: any;
}) {
  const { setColorBottomSheet } = useAppStore();

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setColorBottomSheet(product);
  };

  return (
    <div
      className="product-photos-slider min-w-full h-[20px] bg-transparent  max-w-[176px] w-auto left-0 right-0 m-0 z-9999999 cursor-pointer hover:scale-125 transition-all origin-bottom top-[274px] overflow-hidden flex absolute align-center justify-center"
      data-pw="productPhotoSlider"
      onClick={handleClick}
      style={{ opacity: "1", zIndex: "10" }}
    >
      <div
        className="avatar-slider mx-auto my-0 w-fit!"
        onClick={handleClick}
        onTouchEnd={handleClick}
        onMouseUp={handleClick}
        onMouseDown={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

export default ProductColorsWrapper;

export const StaticStackedSlider = ({
  children,
  activeIndex = 0,
  slideWidth = 50, // Corresponds to your previous slide_width
  overlapFactor = 0.5, // How much slides should overlap (0 to 1)
  scaleDecay = 0.1, // How much scale drops per step away from center
  minScale = 0.7,
  className = "",
}) => {
  // Convert children to array to safely map over them
  const slides = React.Children.toArray(children);

  return (
    <div
      className={`relative w-full flex items-center justify-center overflow-visible select-none ${className}`}
      // If you want to enforce a specific height, add it here or via className
    >
      {slides.map((child, index) => {
        // 1. Calculate Distance
        const distanceFromActive = index - activeIndex;
        const absDistance = Math.abs(distanceFromActive);

        // 2. Calculate Scale
        // We subtract the decay factor based on how far we are from active
        const rawScale = 1 - absDistance * scaleDecay;
        const scale = Math.max(rawScale, minScale);

        // 3. Calculate Z-Index
        // Center item is highest, dropping as we go outwards
        const zIndex = 100 - absDistance * 10;

        // 4. Calculate Margins (The "Flex" replacement for translateX)
        // Since we are scaling down, flex items still take up full width in DOM.
        // We need negative margins to:
        // A) Compensate for the empty space caused by scaling
        // B) Create the "Overlap" effect

        // Calculate the visual width after scaling
        const scaledWidth = slideWidth * scale;

        // The space lost due to scaling (divided by 2 for one side)
        const scalingOverlap = (slideWidth - scaledWidth) / 2;

        // The intentional overlap logic from your original code
        const stackOverlap = slideWidth * overlapFactor;

        // Total negative margin needed
        const marginAdjustment = -(scalingOverlap + stackOverlap);

        return (
          <div
            key={index}
            style={{
              // Use 'order' to strictly enforce sequence (per your request),
              // though array mapping usually handles this.
              order: index,
              width: `${slideWidth}px`,
              height: `${slideWidth}px`, // Assuming square aspect ratio from original
              zIndex: zIndex,
              transform: `scale(${scale})`,
              // Apply negative margins to create the stack effect
              marginLeft: `${marginAdjustment}px`,
              marginRight: `${marginAdjustment}px`,
              transition: "transform 0.3s ease", // Optional: keeps it smooth if props change
            }}
            className="shrink-0 flex items-center justify-center relative transform-gpu"
          >
            {/* Clone the child to pass 'isActive' prop if the child supports it,
               otherwise just render the child.
            */}
            {React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  isActive: index === activeIndex,
                  style: {
                    ...(child.props as any).style,
                    width: "100%",
                    height: "100%",
                  },
                })
              : child}
          </div>
        );
      })}
    </div>
  );
};
