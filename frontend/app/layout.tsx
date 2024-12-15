import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAP Nexus AI",
  description: "SAP Nexus AI - Akıllı Stok ve Envanter Yönetimi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          suppressHydrationWarning
        >
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1 overflow-y-auto bg-background p-6">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}