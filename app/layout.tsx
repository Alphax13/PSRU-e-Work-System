import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { SessionProvider } from "next-auth/react";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Annual Performance Evaluation System",
  description: "ระบบประเมินผลการปฏิบัติงานประจำปี",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className={`${kanit.className} overflow-x-hidden bg-gray-50 text-gray-900 antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
