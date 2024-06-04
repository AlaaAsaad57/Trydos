import Image from "next/image";
function BuyButton() {
  return (
    <div className="buy-button">
      <span>Buy</span>
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
