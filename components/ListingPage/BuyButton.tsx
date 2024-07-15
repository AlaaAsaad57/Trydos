import Image from "next/image";
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
      <Image
        src={"/svg/BuyButton.svg"}
        width={15}
        height={15}
        alt="buy Button"
        unoptimized
      />
    </div>
  );
}

export default BuyButton;
