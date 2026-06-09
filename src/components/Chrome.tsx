"use client";

import { useLocale } from "./LocaleProvider";
import { TaijiGate } from "./TaijiGate";

/**
 * Client chrome for the app: localized header nav + footer, with the
 * 太极双鱼 language gate overlaid until a locale has been chosen.
 */
export function Chrome({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale, chosen, ready } = useLocale();
  const githubUrl = "https://github.com/suzakuzhang";

  return (
    <>
      {ready && !chosen && <TaijiGate />}

      <header className="border-b border-[var(--border)] px-6 py-4">
        <nav className="max-w-4xl mx-auto flex items-center gap-6">
          <a href="/" className="text-lg font-semibold tracking-wide">
            {t.brand}
          </a>
          <a href="/cast" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            {t.nav.cast}
          </a>
          <a
            href="/hexagrams"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {t.nav.hexagrams}
          </a>
          <a href="/search" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            {t.nav.search}
          </a>
          <button
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="ml-auto text-xs tracking-[0.2em] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] rounded px-2 py-1"
            aria-label="toggle language"
          >
            {t.langToggle}
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>

      <footer className="border-t border-[var(--border)] px-6 py-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-xs text-[var(--muted)] space-y-1">
          <p>{t.foot}</p>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            Designed by Shumin Zhang
          </a>
        </div>
      </footer>
    </>
  );
}
