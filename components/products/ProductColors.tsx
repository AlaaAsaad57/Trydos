import HortiznalScrollBar from "components/global/HortiznalScrollBar";
function ProductColors({
  isRtl,
  children,
}: {
  isRtl: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <HortiznalScrollBar
        id="products-colors-slider"
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  w-auto max-w-[50%] gap-[2px] h-[84px] items-center translate-y-[-6px]`}
      >
        {children}
      </HortiznalScrollBar>
    </>
  );
}

export default ProductColors;
