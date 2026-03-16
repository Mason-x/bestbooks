import type { Metadata } from "next";
import { Merriweather, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const titleFont = Merriweather({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BestBooks",
  description: "Goodreads-style book list browser powered by PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${titleFont.variable} ${bodyFont.variable} antialiased`}>
        <div className="page-shell">{children}</div>
      </body>
    </html>
  );
}
