import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CogniTrack",
  description: "Real-time viewer engagement and emotion tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
