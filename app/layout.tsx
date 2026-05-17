import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Steam MP Game Finder",
  description: "Find multiplayer games you and your friends all own on Steam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
