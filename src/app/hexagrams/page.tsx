"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { hexNameEn } from "@/lib/i18n/hexEn";

interface HexagramSummary {
  id: number;
  name: string;
  fullName: string;
  upperTrigram: string;
  lowerTrigram: string;
  section: string;
}

export default function HexagramsPage() {
  const { t, locale } = useLocale();
  const [hexagrams, setHexagrams] = useState<HexagramSummary[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/hexagrams")
      .then((r) => r.json())
      .then((d) => setHexagrams(d.hexagrams ?? []));
  }, []);

  const nameEn = (id: number) => hexNameEn(id);

  const filtered = search
    ? hexagrams.filter(
        (h) =>
          h.name.includes(search) ||
          h.fullName.includes(search) ||
          nameEn(h.id).toLowerCase().includes(search.toLowerCase()) ||
          String(h.id) === search
      )
    : hexagrams;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t.hexagrams.title}</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.hexagrams.searchPh}
        className="w-full max-w-sm border border-[var(--border)] rounded px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {filtered.map((h) => (
          <a
            key={h.id}
            href={`/hexagrams/${h.id}`}
            className="border border-[var(--border)] rounded p-2 text-center hover:border-[var(--accent)] transition-colors"
          >
            <span className="text-xs text-[var(--muted)]">{h.id}</span>
            <p className="font-semibold text-sm">
              {locale === "en" ? nameEn(h.id) || h.name : h.name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {locale === "en" ? `#${h.id}` : h.fullName}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
