import AuthNavContainer from "components/Home/AuthNavContainer";

export default function Page() {
  try {
    /*@ts-expect-error Async Server Component is valid in Next  */

    return <AuthNavContainer />;
  } catch (error) {
    console.error(error);
    return <></>;
  }
}
