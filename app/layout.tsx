import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevOps Learning Platform - Master DevOps from Zero to Hero",
  description: "Comprehensive DevOps learning platform with structured roadmaps, hands-on labs, and automated content from AWS official sources. Learn Docker, Kubernetes, CI/CD, and more.",
  keywords: "DevOps, AWS, Docker, Kubernetes, CI/CD, Learning Platform, Cloud Computing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
