import type { Metadata } from "next";
import "./globals.css";
import MobileNav from "@/components/MobileNav";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "CampusConnect",
  description: "Smart Campus Assistant",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased pb-14 md:pb-0">
        <Navbar />
        {children}
        <MobileNav />
      </body>
    </html>
  );
}

