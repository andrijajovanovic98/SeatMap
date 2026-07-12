import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeatFlow – Ülésrend-tervező",
  description: "Vizuális ülésrend-tervező esküvőkhöz és rendezvényekhez",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className="h-full antialiased">
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
