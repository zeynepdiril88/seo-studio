import type { Metadata } from "next";
import { Manrope, Fira_Code } from "next/font/google";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SEO Studio — SEO + GEO content workbench",
  description:
    "Audit any site for SEO, GEO and AEO, research keywords, and write content that ranks and gets cited by AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
