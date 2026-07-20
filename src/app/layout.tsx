import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeatFlow - Seating Plan Designer",
  description: "Visual seating-plan designer for weddings and events",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Left scalable on purpose: locking it out breaks OS accessibility zoom, and iOS has
  // ignored maximumScale since iOS 10 anyway. Input focus-zoom is instead prevented by
  // the 16px coarse-pointer font size in globals.css.
  userScalable: true,
  // Without this env(safe-area-inset-*) always resolves to 0, so notch and
  // home-indicator padding can never be honoured.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* h-dvh, not h-full: on mobile the large viewport sits behind the collapsing
          URL bar, cutting off the bottom of a h-full app shell. */}
      <body className="h-dvh flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
