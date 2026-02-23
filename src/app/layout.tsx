import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dey Took R Jarbs | AI Job Tracker",
  description: "AI-powered job hunting command center. Scrape, analyze, and apply with confidence.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className="antialiased bg-background text-foreground font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
