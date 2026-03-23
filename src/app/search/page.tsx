"use client";

import { useState } from "react";
import TextLayerLabel from "@/components/TextLayerLabel";

interface SearchHit {
  hexagramId: number;
  hexagramName: string;
  hexagramFullName: string;
  field: string;
  layer: "经文" | "传文";
  label: string;
  content: string;
  matchSnippet: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setHits(data.hits ?? []);
      setTotal(data.total ?? 0);
      setSearched(true);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">经文检索</h1>
      <p className="text-sm text-[var(--muted)]">
        搜索六十四卦的卦辞、爻辞、彖传、象传、文言、序卦传、杂卦传。
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="输入关键词，如：元亨利贞、君子、大川…"
          className="flex-1 max-w-md border border-[var(--border)] rounded px-3 py-2 text-sm"
        />
        <button
          onClick={doSearch}
          disabled={loading || !query.trim()}
          className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333] disabled:opacity-50"
        >
          {loading ? "搜索中…" : "搜索"}
        </button>
      </div>

      {searched && (
        <p className="text-sm text-[var(--muted)]">
          找到 {total} 条结果{total >= 50 ? "（已截取前 50 条）" : ""}
        </p>
      )}

      <div className="space-y-3">
        {hits.map((hit, i) => (
          <div key={i} className="border border-[var(--border)] rounded p-3 space-y-1">
            <div className="flex items-center gap-2">
              <a
                href={`/hexagrams/${hit.hexagramId}`}
                className="font-medium text-sm hover:underline"
              >
                {hit.hexagramFullName}
              </a>
              <TextLayerLabel layer={hit.layer} />
              <span className="text-xs text-[var(--muted)]">{hit.label}</span>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {hit.matchSnippet.split(query).map((part, j, arr) => (
                <span key={j}>
                  {part}
                  {j < arr.length - 1 && (
                    <mark className="bg-amber-200 text-[var(--foreground)] px-0.5 rounded">
                      {query}
                    </mark>
                  )}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
