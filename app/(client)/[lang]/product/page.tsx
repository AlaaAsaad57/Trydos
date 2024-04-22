import { ProductInterface } from "models/product";

async function page(): Promise<any> {
  const productJson: ProductInterface = {
    id: 1,
    name: "name",
    price: null,
    details: 10,
  };
  return (
    <div>
      product details: {JSON.stringify(productJson)}
      <div>
        {productJson.details.map((one, i) => {
          return <div key={i}>{one}</div>;
        })}
      </div>
    </div>
  );
}

export default page;
