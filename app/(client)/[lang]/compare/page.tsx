import "styles/productDetails.css";
import { ComparePagePropsType } from "models/componentType/compareTypes/comparePagePropsType";
import ComparePage from "components/global/compare";
export const dynamic = "auto";
export async function generateMetadata({ params }) {
  let Params = await params;
  try {
    const metadata = {
      title: "Compare Products - TryDos",
      description:
        "Compare products side by side on TryDos - Make informed purchasing decisions.",
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${Params.lang}/compare`,
      },
    };
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: "Compare Products - TryDos",
      description:
        "Compare products side by side on TryDos - Make informed purchasing decisions.",
    };
  }
}

async function Page() {
  // Server component to render JSON-LD structured data

  return (
    <>
      <ComparePage />
    </>
  );
}

export default Page;
