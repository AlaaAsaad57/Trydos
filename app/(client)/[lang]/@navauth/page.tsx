import { ErrorReporterInit } from "components/global/ErrorReporterInit";
import VersionChecker from "components/global/VersionChecker";
import NavbarClient from "components/Home/NavbarClient";

export default function Page() {
  return (
    <>
      <ErrorReporterInit />
      <VersionChecker />
      <NavbarClient />
    </>
  );
}
