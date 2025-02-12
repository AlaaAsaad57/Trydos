import { useDispatch } from "node_modules/react-redux/es";

function ProductHurryUp({ data }) {
  const dispatch = useDispatch();
  return (
    <div
      className="flex-row"
      onClick={() => {
        dispatch({ type: "ENABLE-CART", payload: true });
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
