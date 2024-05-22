import Script from "next/script";

function GAComponent() {
  // let GA_MEASUREMENT_ID = "G-EK7TKN11PV";
  return (
    <>
      <Script
        defer
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
      />

      <Script id="" strategy="lazyOnload" defer>
        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              });
          `}
      </Script>
    </>
  );
}

export default GAComponent;
