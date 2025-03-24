import "styles/productDetails.css";
import CustomNavbarServer from "components/Server/ServerCustomNav";

import { notFound } from "next/navigation";
import ComparePage from "components/global/compare";

export async function generateMetadata({ params, searchParams }) {
  try {
    return {
      title: "Compare Products",
      description: "Compare Products",
    };
  } catch (error) {
    notFound();
  }
}

interface Props {
  params: {
    lang: string;
    productId: string;
  };
}
async function Page({ params }: Props) {
  return (
    <>
      <CustomNavbarServer lang={params.lang} />

      <ComparePage />
    </>
  );
}

export default Page;
