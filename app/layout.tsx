import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adult Video Platform",
  description: "Adult content video sharing platform",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AgeVerificationModal />
            {children}
            <Toaster />
          </ThemeProvider>
        </ConvexClientProvider>

        {/* Popunder Ad - Global */}
        <Script
          src="//pl28167398.effectivegatecpm.com/ac/d7/5e/acd75e32eb6aeacdfedfed8e6158593d.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
