import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "周易 — 结构化阅读与演卦系统",
  description: "基于《周易本义》的六十四卦结构化阅读与演卦解释 Web App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <header className="border-b border-[var(--border)] px-6 py-4">
          <nav className="max-w-4xl mx-auto flex items-center gap-6">
            <a href="/" className="text-lg font-semibold tracking-wide">
              周易
            </a>
            <a href="/cast" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              起卦
            </a>
            <a href="/hexagrams" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              六十四卦
            </a>
            <a href="/search" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              检索
            </a>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] px-6 py-4 mt-8">
          <div className="max-w-4xl mx-auto text-center text-xs text-[var(--muted)]">
            <span>A research prototype</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
