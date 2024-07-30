"use client";
function BuyButton({ buy }) {
  return (
    <div
      className="buy-button light-text flex align-start justify-start cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        buy();
      }}
    >
      <span className="f-10 flex align-start">Buy</span>
      <img
        src={"/svg/BuyButton.svg"}
        width={15}
        height={15}
        alt="buy Button"
        className="max-h-[20px] max-w-[40px]"
      />
    </div>
  );
}

export default BuyButton;
