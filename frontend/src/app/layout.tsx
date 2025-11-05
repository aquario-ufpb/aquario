import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import NavWrapper from "@/components/shared/nav-wrapper";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SearchProvider } from "@/contexts/search-context";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Aquario",
  description: "O seu melhor guia e comunidade para a UFPB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
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
                <SearchProvider>
                  <div className="flex flex-1 flex-col bg-white dark:bg-transparent">
                    <NavWrapper />
                    <main className="pt-[60px] md:pt-0">
                      {children}
                    </main>
                  </div>
                </SearchProvider>
              </ThemeProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
