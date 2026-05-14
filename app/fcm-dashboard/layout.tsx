import "styles/globals.css";

export const metadata = {
  title: "FCM Dashboard — Internal",
  robots: { index: false, follow: false },
};

export default function FcmDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
