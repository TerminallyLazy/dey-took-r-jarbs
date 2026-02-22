import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dey Took R Jarbs | AI Job Tracker",
  description: "AI-powered job hunting command center. Scrape, analyze, and apply with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
