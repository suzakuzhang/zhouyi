"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function Home() {
  const { t } = useLocale();
  const h = t.home;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">{h.title}</h1>
        <p className="text-[var(--muted)] leading-relaxed">{h.intro}</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/cast"
          className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
        >
          <h2 className="font-semibold mb-2">{h.castTitle}</h2>
          <p className="text-sm text-[var(--muted)]">{h.castDesc}</p>
        </a>

        <a
          href="/hexagrams"
          className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
        >
          <h2 className="font-semibold mb-2">{h.hexTitle}</h2>
          <p className="text-sm text-[var(--muted)]">{h.hexDesc}</p>
        </a>
      </div>

      <section className="text-xs text-[var(--muted)] space-y-1 pt-4 border-t border-[var(--border)]">
        <p>{h.disclaimer1}</p>
        <p>{h.disclaimer2}</p>
        <p className="pt-2">
          <a href="/admin" className="underline hover:text-[var(--foreground)]">
            {h.admin}
          </a>
        </p>
      </section>
    </div>
  );
}
