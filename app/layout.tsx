import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const lexend = Lexend({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: {
    default: "Surrealbox",
    template: "%s | Surrealbox",
  },
  icons: {
    icon: [
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicons/site.webmanifest",
  description:
    "Surrealbox is a weight-based Q&A platform where questions and answers rise or fall based on the reputation of the people who vote on them.",
  keywords: [
    "Q&A platform",
    "debate",
    "questions and answers",
    "weighted voting",
    "knowledge sharing",
    "community forum",
  ],
  authors: [{ name: "Surrealbox Team" }],
  creator: "Surrealbox Team",
  publisher: "Surrealbox",
  robots: {
    index: true,
    follow: true,
  },
};

import { UserProvider } from "@/context/UserContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("antialiased", "h-full", lexend.variable, "font-sans")}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col selection:bg-main selection:text-white" suppressHydrationWarning>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "15px",
              padding: "12px 16px",
              fontSize: "12px",
              fontWeight: "700",
              color: "#000000",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            },
          }}
        />
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
