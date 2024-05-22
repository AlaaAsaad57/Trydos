import { useState } from "react";
import Loadding from "public/svg/loading.svg";
import { Img } from "react-image";
import { getConfiguredImage } from "utils/functions";
import Skeleton from "react-loading-skeleton";
function CategoryPhoto(props: {
  alt: string;
  width: string | number;
  src: string;
  height: string | number;
  style: object;
}) {
  const [reload, setReload] = useState(true);
  const [src, setSrc] = useState(props.src);
  const onClick = () => {
    setReload(false);
    setTimeout(() => {
      setSrc(props.src + `?t=${new Date().getTime()}`);
      setReload(true);
    }, 1000);
  };
  return (
    <>
      {
        <Img
          {...props}
          src={[
            getConfiguredImage({
              src: src,
              width: props.width,
              height: 30,
            }),
          ]}
          loader={
            <Skeleton
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
              }}
            />
          }
          unloader={<Loadding onClick={() => onClick()} />}
        />
      }
    </>
  );
}

export default CategoryPhoto;
