import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppHarbr Network Compatibility",
  description:
    "Live Android and iOS ad network version compatibility by AppHarbr SDK version.",
  icons: {
    icon: "https://appharbr.geoedge.com/favicon.ico",
    shortcut: "https://appharbr.geoedge.com/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
