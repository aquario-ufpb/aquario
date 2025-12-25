import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import NavWrapper from "@/components/shared/nav-wrapper";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Aquario",
  description: "O seu melhor guia e comunidade para o Centro de Informática da UFPB",
  icons: {
    icon: "/logo.png", // Favicon (browser tab icon)
    shortcut: "/logo.png", // Shortcut icon
    apple: "/logo.png", // Apple touch icon
  },
  openGraph: {
    title: "Aquario",
    description: "O seu melhor guia e comunidade para o Centro de Informática da UFPB",
    images: [
      {
        url: "/logo.png", // Logo for social media sharing
        width: 1200,
        height: 630,
        alt: "Aquario Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans bg-white dark:bg-transparent`}>
        <PostHogProvider>
          <ReactQueryProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <div className="flex flex-1 flex-col bg-white dark:bg-transparent">
                  <NavWrapper />
                  <div className="pt-0">{children}</div>
                </div>
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
