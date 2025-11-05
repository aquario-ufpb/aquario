import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import NavWrapper from "@/components/shared/nav-wrapper";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SearchProvider } from "@/contexts/search-context";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";

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
                  <div className="pt-24">
                    {children}
                  </div>
                </div>
              </SearchProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
