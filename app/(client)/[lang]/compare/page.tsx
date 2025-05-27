import "styles/productDetails.css";

import { notFound } from "next/navigation";
import ComparePage from "components/global/compare";
export const dynamic = "auto";
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
  };
  searchParams: any;
}
async function Page({ params, searchParams }: Props) {
  return (
    <>
      <ComparePage />
    </>
  );
}

export default Page;
