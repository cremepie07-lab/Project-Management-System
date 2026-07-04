import type { Metadata } from "next";

import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
// @ts-ignore: CSS module declaration missing in this project setup
import "./global.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WorkFlow",
  icons: {
    icon: "/logo.svg",  
  },
  description: "Quản lý công việc nhóm hiệu quả",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}