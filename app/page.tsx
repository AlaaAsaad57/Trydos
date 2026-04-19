import Image from "next/image";

export default function LandingPage() {
  return (
    <html lang="en">
      <head>
        <title>Trydos - The Ultimate AI-Powered Task Management App</title>
      </head>
      <body>
        <main className="flex min-h-screen items-center justify-center bg-white">
          <Image
            src="/icons/Logo.svg"
            alt="Trydos Logo"
            width={220}
            height={86}
            priority
          />
        </main>
      </body>
    </html>
  );
}
