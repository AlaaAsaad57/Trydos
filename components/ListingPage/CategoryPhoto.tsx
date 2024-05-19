import { useState } from "react";
import Loadding from "public/svg/loading.svg";
import { Img } from "react-image";
import { getConfiguredImage } from "utils/functions";
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
              width: 20,
              height: 20,
            }),
          ]}
          unloader={<Loadding onClick={() => onClick()} />}
        />
      }
    </>
  );
}

export default CategoryPhoto;
