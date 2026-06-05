"use client";

import { useEffect, useState } from "react";
import HexagramSymbol from "@/components/HexagramSymbol";
import TextLayerLabel from "@/components/TextLayerLabel";
import SpiritPanel from "@/components/SpiritPanel";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useLocale } from "@/components/LocaleProvider";
import { messages } from "@/lib/i18n/messages";
import { hexNameEn } from "@/lib/i18n/hexEn";
import {
  enTextLabel,
  enTextContent,
  enRationale,
  enDynamicStatic,
} from "@/lib/i18n/localizeReading";

// Chinese trigram char → English image name, derived from the message catalogue.
const TRIG_EN: Record<string, string> = Object.fromEntries(
  messages.zh.cast.trigrams.map((z, i) => [z, messages.en.cast.trigrams[i]])
);

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
  const { locale } = useLocale();
  const name = locale === "en" ? hexNameEn(hex.id) || hex.fullName : hex.fullName;
  return (
    <div className="text-center space-y-1">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <HexagramSymbol lines={hex.lines} size={48} />
      <p className="text-xs font-medium">{name}</p>
    </div>
  );
}

interface LlmSummary {
  xiangyi: string;
  guaci: string;
  shibian: string;
  jinjie: string;
  kexing: string;
  // backward compat
  guaxiang?: string;
  yaoci?: string;
  biangua?: string;
  baihua?: string;
  jianyi?: string;
}

export default function ResultPage() {
  const { t, locale } = useLocale();
  const r = t.result;
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
          castId: result.rawCastResult?.id ?? "",
          structure: result.structure,
          readingStrategy: result.readingStrategy,
          question: result.rawCastResult?.input?.question ?? "",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setLlmError(d.error ?? r.llmFailed);
      } else {
        setLlmSummary(await res.json());
      }
    } catch {
      setLlmError(r.llmNetwork);
    } finally {
      setLlmLoading(false);
    }
  };

  // hexagram name in the active locale
  const nameOf = (id: number, zhName: string) =>
    locale === "en" ? hexNameEn(id) || zhName : zhName;
  const trig = (zhChar: string) => (locale === "en" ? TRIG_EN[zhChar] ?? zhChar : zhChar);
  const locLabel = (ref: string, zhLabel: string) =>
    locale === "en" ? enTextLabel(ref, zhLabel) : zhLabel;
  const locContent = (ref: string, zhContent: string) =>
    locale === "en" ? enTextContent(ref) ?? zhContent : zhContent;

  if (!result) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{r.title}</h1>
        <p className="text-[var(--muted)]">
          {r.emptyPre}
          <a href="/cast" className="underline">
            {r.emptyLink}
          </a>
          {r.emptyPost}
        </p>
      </div>
    );
  }

  const { structure, readingStrategy, rawCastResult } = result;
  const { mutualHexagram, inverseHexagram, reversedHexagram } = rawCastResult;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">{r.title}</h1>

      {/* Main Hexagrams: Original → Changed */}
      <div className="flex gap-8 items-start">
        <div className="text-center space-y-2">
          <p className="text-xs text-[var(--muted)]">{r.original}</p>
          <HexagramSymbol
            lines={rawCastResult.originalHexagram.lines}
            changingLines={rawCastResult.changingLines}
            size={72}
          />
          <p className="font-semibold">
            {nameOf(structure.originalHexagramId, structure.originalHexagramName)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {r.lowerUpper(trig(structure.lowerTrigram), trig(structure.upperTrigram))}
          </p>
        </div>

        {rawCastResult.changedHexagram && (
          <>
            <div className="flex items-center pt-8">
              <span className="text-[var(--muted)] text-lg">→</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs text-[var(--muted)]">{r.changed}</p>
              <HexagramSymbol lines={rawCastResult.changedHexagram.lines} size={72} />
              <p className="font-semibold">
                {nameOf(
                  structure.changedHexagramId ?? rawCastResult.changedHexagram.id,
                  structure.changedHexagramName ?? rawCastResult.changedHexagram.fullName
                )}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Mutual / Inverse / Reversed */}
      {(mutualHexagram || inverseHexagram || reversedHexagram) && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm text-[var(--muted)]">{r.auxTitle}</h2>
          <p className="text-xs text-[var(--muted)]">{r.auxNote}</p>
          <div className="flex gap-6 items-start">
            {mutualHexagram && <SmallHexCard label={r.mutual} hex={mutualHexagram} />}
            {inverseHexagram && <SmallHexCard label={r.inverse} hex={inverseHexagram} />}
            {reversedHexagram && <SmallHexCard label={r.reversed} hex={reversedHexagram} />}
          </div>
        </section>
      )}

      {/* Structure Layer */}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">{r.structureTitle}</h2>
        <div className="text-sm space-y-1 text-[var(--muted)]">
          <p>
            {r.yinyang(
              structure.yinYangDistribution.yang,
              structure.yinYangDistribution.yin
            )}
          </p>
          <p>
            {locale === "en"
              ? enDynamicStatic(structure.changingLines)
              : structure.dynamicStaticRelation}
          </p>
        </div>
      </section>

      {/* Reading Strategy */}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">{r.strategyTitle}</h2>
        <p className="text-sm bg-gray-50 rounded px-3 py-2 border border-[var(--border)]">
          {locale === "en"
            ? enRationale(
                readingStrategy.policyName,
                readingStrategy.changingLineCount,
                structure.changingLines,
                structure.originalHexagramId,
                !!structure.changedHexagramId
              )
            : readingStrategy.rationale}
        </p>
      </section>

      {/* Primary Texts */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm">{r.primaryTitle}</h2>
        {readingStrategy.primaryTexts.map((txt) => (
          <div key={txt.ref} className="space-y-1">
            <div className="flex items-center gap-2">
              <TextLayerLabel layer={txt.layer} />
              <span className="text-sm font-medium">{locLabel(txt.ref, txt.label)}</span>
            </div>
            <p
              className={`text-sm leading-relaxed ${
                txt.layer === "经文" ? "text-layer-jingwen" : "text-layer-chuanwen"
              }`}
            >
              {locContent(txt.ref, txt.content)}
            </p>
          </div>
        ))}
      </section>

      {/* Secondary Texts */}
      {readingStrategy.secondaryTexts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-[var(--muted)]">{r.secondaryTitle}</h2>
          {readingStrategy.secondaryTexts.map((txt) => (
            <div key={txt.ref} className="space-y-1">
              <div className="flex items-center gap-2">
                <TextLayerLabel layer={txt.layer} />
                <span className="text-sm">{locLabel(txt.ref, txt.label)}</span>
              </div>
              <p
                className={`text-sm leading-relaxed text-[var(--muted)] ${
                  txt.layer === "经文" ? "text-layer-jingwen" : "text-layer-chuanwen"
                }`}
              >
                {locContent(txt.ref, txt.content)}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* LLM Summary (Layer 4) */}
      <section className="space-y-3">
        {!llmSummary && !llmLoading && (
          <button
            onClick={requestLlmSummary}
            disabled={llmLoading}
            className="w-full py-4 rounded-lg text-white font-medium text-base bg-gradient-to-r from-[#1a1a1a] to-[#333] hover:from-[#333] hover:to-[#555] active:scale-[0.98] transition-all shadow-sm"
          >
            {r.llmCta}
            <span className="block text-xs font-normal opacity-70 mt-0.5">{r.llmCtaSub}</span>
          </button>
        )}
        {llmLoading && <h2 className="font-semibold text-sm">{r.llmCta}</h2>}
        {llmError && <p className="text-sm text-red-600">{llmError}</p>}
        <LoadingOverlay visible={llmLoading} hexagramName={rawCastResult.originalHexagram.name} />
        {llmSummary && (
          <div className="space-y-4 bg-gray-50 border border-[var(--border)] rounded p-5">
            {(llmSummary.xiangyi || llmSummary.guaxiang) && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{r.fieldXiangyi}</p>
                <p className="text-sm leading-relaxed text-layer-system">
                  {llmSummary.xiangyi || llmSummary.guaxiang}
                </p>
              </div>
            )}
            {(llmSummary.guaci || llmSummary.yaoci) && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{r.fieldGuaci}</p>
                <p className="text-sm leading-relaxed text-layer-system">
                  {llmSummary.guaci || llmSummary.yaoci}
                </p>
              </div>
            )}
            {(llmSummary.shibian || llmSummary.biangua) && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{r.fieldShibian}</p>
                <p className="text-sm leading-relaxed text-layer-system">
                  {llmSummary.shibian || llmSummary.biangua}
                </p>
              </div>
            )}
            {(llmSummary.jinjie || llmSummary.baihua) && (
              <div className="space-y-1 bg-amber-50 border border-amber-200 rounded px-4 py-3">
                <p className="text-sm font-semibold">{r.fieldJinjie}</p>
                <p className="text-sm leading-relaxed">{llmSummary.jinjie || llmSummary.baihua}</p>
              </div>
            )}
            {(llmSummary.kexing || llmSummary.jianyi) && (
              <div className="space-y-1 bg-white border border-[var(--border)] rounded px-4 py-3">
                <p className="text-sm font-semibold">{r.fieldKexing}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {llmSummary.kexing || llmSummary.jianyi}
                </p>
              </div>
            )}
          </div>
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
        <a
          href="/result/texts"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline"
        >
          {r.textsLink}
        </a>
        <a
          href="/result/debug"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline"
        >
          {r.debugLink}
        </a>
        <a
          href="/cast"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline"
        >
          {r.recast}
        </a>
      </div>
    </div>
  );
}
