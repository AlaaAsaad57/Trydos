import Image from "next/image";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <Image
        src="/icons/Logo.svg"
        alt="Trydos Logo"
        width={220}
        height={86}
        priority
      />
    </main>
  );
}
