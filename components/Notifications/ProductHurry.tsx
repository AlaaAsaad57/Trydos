import { useAppStore } from "store";

function ProductHurryUp({ data }) {
  const { enableCart } = useAppStore();
  return (
    <div
      className="flex-row"
      onClick={() => {
        enableCart(true);
      }}
    >
      <div className="b-icon">
        <img width={80} height={"auto"} src={data.image} />
      </div>
      <div className="flex-col m-2">
        <div className="regular p-2">{data.description}</div>
      </div>
    </div>
  );
}

export default ProductHurryUp;
