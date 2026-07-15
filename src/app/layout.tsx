import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeatFlow - Seating Plan Designer",
  description: "Visual seating-plan designer for weddings and events",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
