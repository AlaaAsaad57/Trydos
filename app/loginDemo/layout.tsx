// Root layout for the /loginDemo redirect. Next 16.4 fails the build when a
// page has no root layout. The page only redirects, so it never renders this.
export default function LoginDemoRedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
