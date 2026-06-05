import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Chrome } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "周易 · I Ching — 结构化阅读与演卦系统",
  description:
    "基于《周易本义》的六十四卦结构化阅读与演卦解释 Web App / A structured reading & casting system for the Yijing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <LocaleProvider>
          <Chrome>{children}</Chrome>
        </LocaleProvider>
      </body>
    </html>
  );
}
