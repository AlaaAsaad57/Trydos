import React from "react";
import { translateFunction } from "utils/functions";
import ShareOptions from "./ShareOptions";

import { ProductInterface } from "models/Genaral/Product";
import { useParams } from "next/navigation";
import { ShareSectionPropsType } from "models/componentType/ShareSectionPropsType";

function ShareSection({
  setShareContacts,
  sharedContacts,
  product,
}: ShareSectionPropsType) {
  var language = "en";
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <div className="extended-section" data-cy="ExtendShareSection">
      <div className="extended-bar-top share-bar-top">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="20"
          height="20"
          viewBox="0 0 20 20"
        >
          <g
            id="Mask_Group_355"
            data-name="Mask Group 355"
            transform="translate(0 -0.238)"
          >
            <path
              id="send-2"
              d="M16.716,3.123,7.4,6.217c-6.26,2.094-6.26,5.508,0,7.591l2.764.918.918,2.764c2.083,6.261,5.507,6.261,7.591,0l3.1-9.3c1.382-4.177-.887-6.457-5.064-5.064Zm.33,5.549-3.919,3.94a.772.772,0,0,1-1.093,0,.778.778,0,0,1,0-1.093l3.919-3.94a.773.773,0,1,1,1.093,1.093Z"
              transform="translate(-2.708 -2.768)"
              fill="#505050"
            />
          </g>
        </svg>

        <span>{translate("Share This Product With", language)}</span>
      </div>
      {/* {sharedContacts.length > 0 && <SearchContact />} */}

      <div className="content-extended">
        <ShareOptions
          setShareContacts={setShareContacts}
          product={product}
          sharedContacts={sharedContacts}
        />
      </div>
    </div>
  );
}

export default ShareSection;
