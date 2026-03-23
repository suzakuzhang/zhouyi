"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/free-usage")
      .then((r) => r.json())
      .then((d) => setFreeRemaining(d.remaining ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">周易 — 结构化阅读与演卦系统</h1>
        <p className="text-[var(--muted)] leading-relaxed">
          基于《周易本义》文本结构与卦爻系统，提供可验证、可追踪、可解释的周易阅读与演卦工具。
        </p>
      </section>

      {freeRemaining !== null && (
        <div className="text-sm text-[var(--muted)] bg-gray-50 border border-[var(--border)] rounded px-4 py-3">
          免费体验剩余 <strong className="text-[var(--foreground)]">{freeRemaining}</strong> 次
          {freeRemaining <= 0 && (
            <span className="ml-2 text-amber-600">
              （已用完，请使用邀请码激活）
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/cast"
          className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
        >
          <h2 className="font-semibold mb-2">起卦</h2>
          <p className="text-sm text-[var(--muted)]">
            输入六爻，生成本卦、变卦与阅读策略
          </p>
        </a>

        <a
          href="/hexagrams"
          className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors"
        >
          <h2 className="font-semibold mb-2">六十四卦</h2>
          <p className="text-sm text-[var(--muted)]">
            浏览六十四卦，查看卦辞、爻辞与经传文本
          </p>
        </a>
      </div>

      <section className="text-xs text-[var(--muted)] space-y-1 pt-4 border-t border-[var(--border)]">
        <p>本项目用于经典文本阅读与结构化解释研究，不构成任何现实决策建议。</p>
        <p>经传文本分层展示，所有解释均标注来源，规则可追踪。</p>
        <p className="pt-2">
          <a href="/admin" className="underline hover:text-[var(--foreground)]">管理后台</a>
        </p>
      </section>
    </div>
  );
}
