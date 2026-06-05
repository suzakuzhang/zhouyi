"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LineInput from "@/components/LineInput";
import HexagramSymbol from "@/components/HexagramSymbol";
import { useLocale } from "@/components/LocaleProvider";

interface LineState {
  value: number;
  changing: boolean;
}

interface CoinThrow {
  coins: [number, number, number];
  total: number;
  yao: number;
  changing: boolean;
}

type CastMethod = "coin" | "meihua" | "manual";

// 先天八卦数序：乾1兑2离3震4巽5坎6艮7坤8，取余映射用0-7
const TRIGRAM_LINES: number[][] = [
  [1, 1, 1], // 乾 (0 or 8)
  [1, 1, 0], // 兑 (1)
  [1, 0, 1], // 离 (2)
  [1, 0, 0], // 震 (3)
  [0, 1, 1], // 巽 (4)
  [0, 1, 0], // 坎 (5)
  [0, 0, 1], // 艮 (6)
  [0, 0, 0], // 坤 (7)
];

function getLunarInfo(): { year: number; month: number; day: number; hour: number } {
  // 用公历近似：实际梅花易数应用农历，这里用简化版
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const h = now.getHours();
  // 地支时辰索引：子(23-1)=0 ... 亥(21-23)=11
  const zhiIndex = Math.floor(((h + 1) % 24) / 2);
  const hour = zhiIndex + 1; // 子时=1, 丑时=2, ...
  return { year, month, day, hour };
}

export default function CastPage() {
  const router = useRouter();
  const { t } = useLocale();
  const c = t.cast;
  const posLabels = c.posLabels;

  const [method, setMethod] = useState<CastMethod>("coin");
  const [lines, setLines] = useState<LineState[]>(
    Array.from({ length: 6 }, () => ({ value: 1, changing: false }))
  );
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Coin method state
  const [coinThrows, setCoinThrows] = useState<CoinThrow[]>([]);
  const [coinStep, setCoinStep] = useState(0);

  // Meihua state
  const [meihuaMode, setMeihuaMode] = useState<"time" | "two_num" | "word">("time");
  const [meihuaNum1, setMeihuaNum1] = useState("");
  const [meihuaNum2, setMeihuaNum2] = useState("");
  const [meihuaWord, setMeihuaWord] = useState("");
  const [meihuaResult, setMeihuaResult] = useState<{
    changingLine: number;
    upperIdx: number;
    lowerIdx: number;
    detail: string;
    lines: LineState[];
  } | null>(null);

  const updateLine = (index: number, value: number, changing: boolean) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { value, changing };
      return next;
    });
  };

  const submitCast = async (castLines: LineState[], castMethod: string = method) => {
    setLoading(true);
    setError("");

    // Attach access token if available
    let accessToken = "";
    try {
      const saved = localStorage.getItem("zhouyi_access");
      if (saved) accessToken = JSON.parse(saved).accessToken ?? "";
    } catch {
      /* ignore */
    }

    const payload: Record<string, unknown> = {
      method: castMethod,
      question,
      lines: castLines.map((l, i) => ({
        position: i + 1,
        value: l.value,
        changing: l.changing,
      })),
    };
    if (accessToken) payload.access_token = accessToken;

    try {
      const res = await fetch("/api/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? c.errors.castFailed);
        setLoading(false);
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("castResult", JSON.stringify(data));
      router.push("/result");
    } catch {
      setError(c.errors.network);
      setLoading(false);
    }
  };

  // ── Coin Method ──────────────────────────────

  const throwCoin = () => {
    const coins: [number, number, number] = [
      Math.random() < 0.5 ? 2 : 3,
      Math.random() < 0.5 ? 2 : 3,
      Math.random() < 0.5 ? 2 : 3,
    ];
    const total = coins[0] + coins[1] + coins[2];

    let yao: number, changing: boolean;
    if (total === 6) {
      yao = 0;
      changing = true;
    } else if (total === 7) {
      yao = 1;
      changing = false;
    } else if (total === 8) {
      yao = 0;
      changing = false;
    } else {
      yao = 1;
      changing = true;
    }

    const th: CoinThrow = { coins, total, yao, changing };
    setCoinThrows([...coinThrows, th]);

    const newLines = [...lines];
    newLines[coinStep] = { value: yao, changing };
    setLines(newLines);
    setCoinStep(coinStep + 1);
  };

  const resetCoin = () => {
    setCoinThrows([]);
    setCoinStep(0);
    setLines(Array.from({ length: 6 }, () => ({ value: 1, changing: false })));
  };

  // ── Meihua Method ────────────────────────────

  const buildMeihuaLines = (upperIdx: number, lowerIdx: number, changingLine: number): LineState[] => {
    const lower = TRIGRAM_LINES[lowerIdx % 8];
    const upper = TRIGRAM_LINES[upperIdx % 8];
    const allLines: LineState[] = [
      ...lower.map((v) => ({ value: v, changing: false })),
      ...upper.map((v) => ({ value: v, changing: false })),
    ];
    if (changingLine >= 1 && changingLine <= 6) {
      allLines[changingLine - 1].changing = true;
    }
    return allLines;
  };

  const castMeihuaByTime = () => {
    const { year, month, day, hour } = getLunarInfo();
    const hourName = `${c.branches[hour - 1]}${c.hourSuffix}`;
    const upperNum = year + month + day;
    const lowerNum = upperNum + hour;
    const changingLine = lowerNum % 6 || 6;

    // 转为0-7索引（梅花易数数序：1乾2兑...8坤，余数0当作8=坤）
    const upperRem = upperNum % 8 || 8;
    const lowerRem = lowerNum % 8 || 8;
    const uIdx = upperRem === 8 ? 7 : upperRem - 1;
    const lIdx = lowerRem === 8 ? 7 : lowerRem - 1;

    const newLines = buildMeihuaLines(uIdx, lIdx, changingLine);
    setLines(newLines);
    setMeihuaResult({
      changingLine,
      upperIdx: uIdx,
      lowerIdx: lIdx,
      detail: c.meihua.timeDetail({
        year,
        month,
        day,
        upperNum,
        upperRem,
        upperName: c.trigrams[uIdx],
        hourName,
        hour,
        lowerNum,
        lowerRem,
        lowerName: c.trigrams[lIdx],
        changingRem: changingLine,
        changingLine,
      }),
      lines: newLines,
    });
  };

  const castMeihuaByNumbers = () => {
    const n1 = parseInt(meihuaNum1);
    const n2 = parseInt(meihuaNum2);
    if (isNaN(n1) || isNaN(n2) || n1 <= 0 || n2 <= 0) {
      setError(c.errors.twoPositive);
      return;
    }
    setError("");

    const upperRem = n1 % 8 || 8;
    const lowerRem = n2 % 8 || 8;
    const changingLine = (n1 + n2) % 6 || 6;

    const uIdx = upperRem === 8 ? 7 : upperRem - 1;
    const lIdx = lowerRem === 8 ? 7 : lowerRem - 1;

    const newLines = buildMeihuaLines(uIdx, lIdx, changingLine);
    setLines(newLines);
    setMeihuaResult({
      changingLine,
      upperIdx: uIdx,
      lowerIdx: lIdx,
      detail: c.meihua.numDetail({
        n1,
        n1rem: upperRem,
        upperName: c.trigrams[uIdx],
        n2,
        n2rem: lowerRem,
        lowerName: c.trigrams[lIdx],
        sumRem: changingLine,
        changingLine,
      }),
      lines: newLines,
    });
  };

  const castMeihuaByWord = () => {
    const chars = meihuaWord.trim();
    if (!chars || chars.length < 1) {
      setError(c.errors.atLeastOneChar);
      return;
    }
    setError("");

    // 按字数笔画用 charCode 近似；单字上卦=字码，下卦=字码+时辰
    // 两字以上：前半取上卦，后半取下卦，总笔画取动爻
    const codes = Array.from(chars).map((ch) => ch.charCodeAt(0));
    const total = codes.reduce((a, b) => a + b, 0);

    let upperNum: number, lowerNum: number;
    if (codes.length === 1) {
      const { hour } = getLunarInfo();
      upperNum = codes[0];
      lowerNum = codes[0] + hour;
    } else {
      const mid = Math.ceil(codes.length / 2);
      upperNum = codes.slice(0, mid).reduce((a, b) => a + b, 0);
      lowerNum = codes.slice(mid).reduce((a, b) => a + b, 0);
    }

    const changingLine = total % 6 || 6;
    const upperRem = upperNum % 8 || 8;
    const lowerRem = lowerNum % 8 || 8;

    const uIdx = upperRem === 8 ? 7 : upperRem - 1;
    const lIdx = lowerRem === 8 ? 7 : lowerRem - 1;

    const newLines = buildMeihuaLines(uIdx, lIdx, changingLine);
    setLines(newLines);
    setMeihuaResult({
      changingLine,
      upperIdx: uIdx,
      lowerIdx: lIdx,
      detail: c.meihua.wordDetail({
        chars,
        upperNum,
        upperRem,
        upperName: c.trigrams[uIdx],
        lowerNum,
        lowerRem,
        lowerName: c.trigrams[lIdx],
        total,
        totalRem: changingLine,
        changingLine,
      }),
      lines: newLines,
    });
  };

  const resetMeihua = () => {
    setMeihuaResult(null);
    setMeihuaNum1("");
    setMeihuaNum2("");
    setMeihuaWord("");
    setLines(Array.from({ length: 6 }, () => ({ value: 1, changing: false })));
  };

  // ── Manual Example ───────────────────────────

  const loadExample = () => {
    setLines([
      { value: 1, changing: true },
      { value: 1, changing: false },
      { value: 1, changing: false },
      { value: 1, changing: false },
      { value: 1, changing: false },
      { value: 1, changing: false },
    ]);
    setQuestion(c.manual.exampleQuestion);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{c.title}</h1>

      {/* Method tabs: coin → meihua → manual */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(
          [
            { key: "coin" as CastMethod, label: c.methods.coin },
            { key: "meihua" as CastMethod, label: c.methods.meihua },
            { key: "manual" as CastMethod, label: c.methods.manual },
          ]
        ).map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMethod(m.key);
              setError("");
              setMeihuaResult(null);
            }}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              method === m.key
                ? "border-[#1a1a1a] font-medium"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Coin method ── */}
      {method === "coin" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">{c.coin.intro}</p>

          {coinThrows.length > 0 && (
            <div className="space-y-1">
              {coinThrows.map((th, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-[var(--muted)]">{posLabels[i]}</span>
                  <span className="w-24 font-mono">
                    {th.coins.map((cc) => (cc === 3 ? c.coin.heads : c.coin.tails)).join(" ")}
                  </span>
                  <span className="w-8 text-center">{th.total}</span>
                  <span className={th.changing ? "text-amber-600 font-medium" : ""}>
                    {c.lineLabels[th.total as 6 | 7 | 8 | 9]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {coinStep < 6 ? (
            <div className="flex gap-3">
              <button
                onClick={throwCoin}
                className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333]"
              >
                {c.coin.throwBtn(coinStep + 1, posLabels[coinStep])}
              </button>
              {coinStep > 0 && (
                <button
                  onClick={resetCoin}
                  className="px-4 py-2 border border-[var(--border)] rounded text-sm text-[var(--muted)]"
                >
                  {c.coin.reset}
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <HexagramSymbol
                lines={lines.map((l) => l.value)}
                changingLines={lines.map((l, i) => (l.changing ? i + 1 : 0)).filter((p) => p > 0)}
                size={64}
              />
              <button
                onClick={resetCoin}
                className="px-4 py-2 border border-[var(--border)] rounded text-sm text-[var(--muted)]"
              >
                {c.coin.reset}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Meihua ── */}
      {method === "meihua" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">{c.meihua.intro}</p>

          {/* Sub-tabs */}
          <div className="flex gap-2">
            {(
              [
                { key: "time" as const, label: c.meihua.modes.time },
                { key: "two_num" as const, label: c.meihua.modes.two_num },
                { key: "word" as const, label: c.meihua.modes.word },
              ]
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => {
                  setMeihuaMode(m.key);
                  resetMeihua();
                }}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  meihuaMode === m.key
                    ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                    : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {meihuaMode === "time" && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">{c.meihua.timeHint}</p>
              {!meihuaResult && (
                <button
                  onClick={castMeihuaByTime}
                  className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333]"
                >
                  {c.meihua.timeBtn}
                </button>
              )}
            </div>
          )}

          {meihuaMode === "two_num" && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">{c.meihua.twoNumHint}</p>
              <div className="flex gap-2 items-end">
                <input
                  type="number"
                  value={meihuaNum1}
                  onChange={(e) => setMeihuaNum1(e.target.value)}
                  placeholder={c.meihua.num1Ph}
                  min="1"
                  className="w-24 border border-[var(--border)] rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={meihuaNum2}
                  onChange={(e) => setMeihuaNum2(e.target.value)}
                  placeholder={c.meihua.num2Ph}
                  min="1"
                  className="w-24 border border-[var(--border)] rounded px-3 py-2 text-sm"
                />
                {!meihuaResult && (
                  <button
                    onClick={castMeihuaByNumbers}
                    className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333]"
                  >
                    {c.meihua.castBtn}
                  </button>
                )}
              </div>
            </div>
          )}

          {meihuaMode === "word" && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">{c.meihua.wordHint}</p>
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  value={meihuaWord}
                  onChange={(e) => setMeihuaWord(e.target.value)}
                  placeholder={c.meihua.wordPh}
                  maxLength={20}
                  className="w-40 border border-[var(--border)] rounded px-3 py-2 text-sm"
                />
                {!meihuaResult && (
                  <button
                    onClick={castMeihuaByWord}
                    className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333]"
                  >
                    {c.meihua.castBtn}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Meihua result */}
          {meihuaResult && (
            <div className="space-y-3 bg-gray-50 border border-[var(--border)] rounded p-4">
              <div className="flex gap-6 items-center">
                <HexagramSymbol
                  lines={meihuaResult.lines.map((l) => l.value)}
                  changingLines={[meihuaResult.changingLine]}
                  size={64}
                />
                <div className="text-sm space-y-1">
                  <p>
                    {c.meihua.resultUpper}{" "}
                    <strong>{c.trigrams[meihuaResult.upperIdx]}</strong>
                    {"　"}
                    {c.meihua.resultLower}{" "}
                    <strong>{c.trigrams[meihuaResult.lowerIdx]}</strong>
                  </p>
                  <p>
                    {c.meihua.resultChanging}{" "}
                    <strong className="text-amber-600">{meihuaResult.changingLine}</strong>{" "}
                    {c.meihua.resultChangingTail}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">{meihuaResult.detail}</p>
              <button onClick={resetMeihua} className="text-xs text-[var(--muted)] underline">
                {c.meihua.recast}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Manual replay ── */}
      {method === "manual" && (
        <>
          <p className="text-sm text-[var(--muted)]">{c.manual.intro}</p>
          <div className="flex gap-8">
            <div className="space-y-0.5">
              {[...Array(6)].map((_, i) => {
                const pos = 5 - i;
                return (
                  <LineInput
                    key={pos}
                    position={pos + 1}
                    value={lines[pos].value}
                    changing={lines[pos].changing}
                    onChange={(v, ch) => updateLine(pos, v, ch)}
                  />
                );
              })}
            </div>
            <div className="flex flex-col items-center justify-center">
              <HexagramSymbol
                lines={lines.map((l) => l.value)}
                changingLines={lines.map((l, i) => (l.changing ? i + 1 : 0)).filter((p) => p > 0)}
                size={64}
              />
            </div>
          </div>
        </>
      )}

      {/* Question */}
      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">{c.question.label}</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={c.question.placeholder}
          maxLength={120}
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={() => submitCast(meihuaResult?.lines ?? lines, method)}
          disabled={loading || (method === "coin" && coinStep < 6) || (method === "meihua" && !meihuaResult)}
          className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333] disabled:opacity-50"
        >
          {loading ? c.submitting : c.submit}
        </button>
        {method === "manual" && (
          <button
            onClick={loadExample}
            type="button"
            className="px-4 py-2 border border-[var(--border)] rounded text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {c.manual.loadExample}
          </button>
        )}
      </div>
    </div>
  );
}
