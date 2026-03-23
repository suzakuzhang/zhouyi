"use client";

import { useEffect, useState } from "react";
import HexagramSymbol from "@/components/HexagramSymbol";
import TextLayerLabel from "@/components/TextLayerLabel";
import SpiritPanel from "@/components/SpiritPanel";

interface TextRef {
  ref: string;
  label: string;
  layer: "经文" | "传文" | "系统说明";
  content: string;
}

interface HexagramBrief {
  lines: number[];
  fullName: string;
  name: string;
  id: number;
  guaCi?: string;
  tuan?: string;
  xiang?: { overall: string; lines: Record<string, string> };
}

interface InterpretationResult {
  structure: {
    originalHexagramName: string;
    originalHexagramId: number;
    upperTrigram: string;
    lowerTrigram: string;
    changingLines: number[];
    changedHexagramName: string | null;
    changedHexagramId: number | null;
    yinYangDistribution: { yin: number; yang: number };
    dynamicStaticRelation: string;
  };
  texts: TextRef[];
  ruleTraces: unknown[];
  readingStrategy: {
    policyName: string;
    changingLineCount: number;
    primaryTexts: TextRef[];
    secondaryTexts: TextRef[];
    rationale: string;
  };
  rawCastResult: {
    id?: string;
    originalHexagram: HexagramBrief;
    changedHexagram?: HexagramBrief | null;
    mutualHexagram?: HexagramBrief | null;
    inverseHexagram?: HexagramBrief | null;
    reversedHexagram?: HexagramBrief | null;
    changingLines: number[];
    input?: { question?: string; method?: string };
  };
}

function SmallHexCard({ label, hex }: { label: string; hex: HexagramBrief }) {
  return (
    <div className="text-center space-y-1">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <HexagramSymbol lines={hex.lines} size={48} />
      <p className="text-xs font-medium">{hex.fullName}</p>
    </div>
  );
}

interface LlmSummary {
  overview: string;
  keyTexts: string;
  summary: string;
}

export default function ResultPage() {
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [llmSummary, setLlmSummary] = useState<LlmSummary | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("castResult");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  const requestLlmSummary = async () => {
    if (!result) return;
    setLlmLoading(true);
    setLlmError("");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structure: result.structure,
          readingStrategy: result.readingStrategy,
          question: result.rawCastResult?.input?.question ?? "",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setLlmError(d.error ?? "解读失败");
      } else {
        setLlmSummary(await res.json());
      }
    } catch {
      setLlmError("网络错误");
    } finally {
      setLlmLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">演卦结果</h1>
        <p className="text-[var(--muted)]">
          暂无结果。请先<a href="/cast" className="underline">起卦</a>。
        </p>
      </div>
    );
  }

  const { structure, readingStrategy, rawCastResult } = result;
  const { mutualHexagram, inverseHexagram, reversedHexagram } = rawCastResult;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">演卦结果</h1>

      {/* Main Hexagrams: Original → Changed */}
      <div className="flex gap-8 items-start">
        <div className="text-center space-y-2">
          <p className="text-xs text-[var(--muted)]">本卦</p>
          <HexagramSymbol
            lines={rawCastResult.originalHexagram.lines}
            changingLines={rawCastResult.changingLines}
            size={72}
          />
          <p className="font-semibold">{structure.originalHexagramName}</p>
          <p className="text-xs text-[var(--muted)]">
            {structure.lowerTrigram}下 {structure.upperTrigram}上
          </p>
        </div>

        {rawCastResult.changedHexagram && (
          <>
            <div className="flex items-center pt-8">
              <span className="text-[var(--muted)] text-lg">→</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs text-[var(--muted)]">变卦</p>
              <HexagramSymbol lines={rawCastResult.changedHexagram.lines} size={72} />
              <p className="font-semibold">{structure.changedHexagramName}</p>
            </div>
          </>
        )}
      </div>

      {/* Mutual / Inverse / Reversed */}
      {(mutualHexagram || inverseHexagram || reversedHexagram) && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm text-[var(--muted)]">辅助卦象</h2>
          <p className="text-xs text-[var(--muted)]">仅作结构参考，不直接等同主断。</p>
          <div className="flex gap-6 items-start">
            {mutualHexagram && <SmallHexCard label="互卦" hex={mutualHexagram} />}
            {inverseHexagram && <SmallHexCard label="错卦" hex={inverseHexagram} />}
            {reversedHexagram && <SmallHexCard label="综卦" hex={reversedHexagram} />}
          </div>
        </section>
      )}

      {/* Structure Layer */}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">结构层</h2>
        <div className="text-sm space-y-1 text-[var(--muted)]">
          <p>阴阳分布：阳{structure.yinYangDistribution.yang} 阴{structure.yinYangDistribution.yin}</p>
          <p>{structure.dynamicStaticRelation}</p>
        </div>
      </section>

      {/* Reading Strategy */}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">阅读策略</h2>
        <p className="text-sm bg-gray-50 rounded px-3 py-2 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted)] mr-2">[{readingStrategy.policyName}]</span>
          {readingStrategy.rationale}
        </p>
      </section>

      {/* Primary Texts */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm">主读文本</h2>
        {readingStrategy.primaryTexts.map((t) => (
          <div key={t.ref} className="space-y-1">
            <div className="flex items-center gap-2">
              <TextLayerLabel layer={t.layer} />
              <span className="text-sm font-medium">{t.label}</span>
            </div>
            <p className={`text-sm leading-relaxed ${t.layer === "经文" ? "text-layer-jingwen" : "text-layer-chuanwen"}`}>
              {t.content}
            </p>
          </div>
        ))}
      </section>

      {/* Secondary Texts */}
      {readingStrategy.secondaryTexts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-[var(--muted)]">次读文本</h2>
          {readingStrategy.secondaryTexts.map((t) => (
            <div key={t.ref} className="space-y-1">
              <div className="flex items-center gap-2">
                <TextLayerLabel layer={t.layer} />
                <span className="text-sm">{t.label}</span>
              </div>
              <p className={`text-sm leading-relaxed text-[var(--muted)] ${t.layer === "经文" ? "text-layer-jingwen" : "text-layer-chuanwen"}`}>
                {t.content}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* LLM Summary (Layer 4) */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">赛博解卦</h2>
          {!llmSummary && (
            <button
              onClick={requestLlmSummary}
              disabled={llmLoading}
              className="px-3 py-1 text-xs border border-[var(--border)] rounded hover:border-[var(--accent)] disabled:opacity-50"
            >
              {llmLoading ? "解卦中…" : "赛博解卦"}
            </button>
          )}
        </div>
        {llmError && <p className="text-sm text-red-600">{llmError}</p>}
        {llmSummary && (
          <div className="space-y-3 bg-gray-50 border border-[var(--border)] rounded p-4">
            <div className="space-y-1">
              <TextLayerLabel layer="系统摘要" />
              <p className="text-sm font-medium">卦象概述</p>
              <p className="text-sm text-layer-system leading-relaxed">{llmSummary.overview}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">经文要点</p>
              <p className="text-sm text-layer-system leading-relaxed">{llmSummary.keyTexts}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">综合提示</p>
              <p className="text-sm text-layer-system leading-relaxed">{llmSummary.summary}</p>
            </div>
          </div>
        )}
        {!llmSummary && !llmLoading && (
          <p className="text-xs text-[var(--muted)]">
            赛博解卦基于上述经传文本生成，仅作阅读辅助，不构成任何现实决策建议。
          </p>
        )}
      </section>

      {/* Spirit Panel */}
      <SpiritPanel
        castId={result.rawCastResult?.id ?? ""}
        hexagramName={rawCastResult.originalHexagram.name}
        hexagramFullName={rawCastResult.originalHexagram.fullName ?? structure.originalHexagramName}
        question={rawCastResult.input?.question ?? ""}
        guaCi={rawCastResult.originalHexagram.guaCi ?? ""}
        tuan={rawCastResult.originalHexagram.tuan ?? ""}
        xiangOverall={rawCastResult.originalHexagram.xiang?.overall ?? ""}
        changingLines={rawCastResult.changingLines}
        changedHexagramName={rawCastResult.changedHexagram?.fullName}
      />

      {/* Navigation */}
      <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
        <a href="/result/texts" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          文本对照
        </a>
        <a href="/result/debug" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          开发者视图
        </a>
        <a href="/cast" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          重新起卦
        </a>
      </div>
    </div>
  );
}
