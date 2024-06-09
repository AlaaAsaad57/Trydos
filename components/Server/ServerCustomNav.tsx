import CustomNavbar from "components/Home/CustomNav";
async function CustomNavbarServer({ lang }: { lang: string }) {
  return <CustomNavbar init={lang} />;
}

export default CustomNavbarServer;
