import AuthNavContainer from "components/Home/AuthNavContainer";

export default function Page() {
  try {
    return <AuthNavContainer />;
  } catch (error) {
    console.error(error);
    return <></>;
  }
}
