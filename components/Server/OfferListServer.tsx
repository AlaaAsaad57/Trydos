import React from "react";

import OfferList from "components/Home/OfferWidgets/OfferList";
import "styles/offers.css";
import "styles/productDetails.css";

async function OfferListServer({ params }) {
  let res = await fetch(process.env.HOST + `/api/boutiques?offset=1&limit=10`);

  let body = await res.json();
  let boutiques = body.data.boutiques;
  return (
    <>
      <OfferList response={body} boutiques={boutiques} key={2} quick={false} />
    </>
  );
}

export default OfferListServer;
