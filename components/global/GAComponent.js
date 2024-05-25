import Script from "next/script";

function GAComponent() {
  // let GA_MEASUREMENT_ID = "G-EK7TKN11PV";
  return (
    <>
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-N8LNVEWJSJ"
      ></Script>
      <Script>
        {`  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-N8LNVEWJSJ');`}
      </Script>
    </>
  );
}

export default GAComponent;
