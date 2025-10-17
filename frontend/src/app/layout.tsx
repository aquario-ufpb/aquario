import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import NavWrapper from "@/components/shared/nav-wrapper";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SearchProvider } from "@/contexts/search-context";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <SearchProvider>
              <div className="flex flex-1 flex-col">
                <NavWrapper />
                {children}
              </div>
            </SearchProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
