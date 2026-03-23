"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LineInput from "@/components/LineInput";
import HexagramSymbol from "@/components/HexagramSymbol";

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
const TRIGRAM_NAMES = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];

function coinLabel(total: number): string {
  switch (total) {
    case 6: return "⚋○ 老阴(动)";
    case 7: return "⚊  少阳";
    case 8: return "⚋  少阴";
    case 9: return "⚊○ 老阳(动)";
    default: return "?";
  }
}

function getLunarInfo(): { year: number; month: number; day: number; hour: number; hourName: string } {
  // 用公历近似：实际梅花易数应用农历，这里用简化版
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const h = now.getHours();
  // 地支时辰：子(23-1)丑(1-3)寅(3-5)卯(5-7)辰(7-9)巳(9-11)午(11-13)未(13-15)申(15-17)酉(17-19)戌(19-21)亥(21-23)
  const zhiNames = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const zhiIndex = Math.floor(((h + 1) % 24) / 2);
  const hour = zhiIndex + 1; // 子时=1, 丑时=2, ...
  return { year, month, day, hour, hourName: zhiNames[zhiIndex] + "时" };
}

export default function CastPage() {
  const router = useRouter();
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
    upper: string; lower: string; changingLine: number;
    upperIdx: number; lowerIdx: number;
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
    } catch { /* ignore */ }

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
        setError(data.error ?? "演卦失败");
        setLoading(false);
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("castResult", JSON.stringify(data));
      router.push("/result");
    } catch {
      setError("网络错误，请重试。");
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
    if (total === 6) { yao = 0; changing = true; }
    else if (total === 7) { yao = 1; changing = false; }
    else if (total === 8) { yao = 0; changing = false; }
    else { yao = 1; changing = true; }

    const t: CoinThrow = { coins, total, yao, changing };
    const newThrows = [...coinThrows, t];
    setCoinThrows(newThrows);

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
    const { year, month, day, hour, hourName } = getLunarInfo();
    const upperNum = year + month + day;
    const lowerNum = upperNum + hour;
    const upperIdx = ((upperNum % 8) + 8) % 8 || 8;
    const lowerIdx = ((lowerNum % 8) + 8) % 8 || 8;
    const changingLine = ((lowerNum % 6) || 6);

    // 转为0-7索引（梅花易数数序：1乾2兑...8坤，余数0当作8=坤）
    const uIdx = upperIdx === 8 ? 7 : upperIdx - 1;
    const lIdx = lowerIdx === 8 ? 7 : lowerIdx - 1;

    const newLines = buildMeihuaLines(uIdx, lIdx, changingLine);
    setLines(newLines);
    setMeihuaResult({
      upper: TRIGRAM_NAMES[uIdx],
      lower: TRIGRAM_NAMES[lIdx],
      changingLine,
      upperIdx: uIdx,
      lowerIdx: lIdx,
      detail: `年${year} + 月${month} + 日${day} = ${upperNum} → 上卦 ${upperNum}÷8 余${upperNum % 8 || 8} = ${TRIGRAM_NAMES[uIdx]}；加时辰${hourName}(${hour}) = ${lowerNum} → 下卦 ${lowerNum}÷8 余${lowerNum % 8 || 8} = ${TRIGRAM_NAMES[lIdx]}；动爻 ${lowerNum}÷6 余${lowerNum % 6 || 6} = 第${changingLine}爻`,
      lines: newLines,
    });
  };

  const castMeihuaByNumbers = () => {
    const n1 = parseInt(meihuaNum1);
    const n2 = parseInt(meihuaNum2);
    if (isNaN(n1) || isNaN(n2) || n1 <= 0 || n2 <= 0) {
      setError("请输入两个正整数");
      return;
    }
    setError("");

    const upperIdx = ((n1 % 8) + 8) % 8 || 8;
    const lowerIdx = ((n2 % 8) + 8) % 8 || 8;
    const changingLine = (((n1 + n2) % 6) || 6);

    const uIdx = upperIdx === 8 ? 7 : upperIdx - 1;
    const lIdx = lowerIdx === 8 ? 7 : lowerIdx - 1;

    const newLines = buildMeihuaLines(uIdx, lIdx, changingLine);
    setLines(newLines);
    setMeihuaResult({
      upper: TRIGRAM_NAMES[uIdx],
      lower: TRIGRAM_NAMES[lIdx],
      changingLine,
      upperIdx: uIdx,
      lowerIdx: lIdx,
      detail: `第一数 ${n1} ÷ 8 余${n1 % 8 || 8} → 上卦${TRIGRAM_NAMES[uIdx]}；第二数 ${n2} ÷ 8 余${n2 % 8 || 8} → 下卦${TRIGRAM_NAMES[lIdx]}；(${n1}+${n2}) ÷ 6 余${(n1 + n2) % 6 || 6} → 动爻第${changingLine}爻`,
      lines: newLines,
    });
  };

  const castMeihuaByWord = () => {
    const chars = meihuaWord.trim();
    if (!chars || chars.length < 1) {
      setError("请输入至少一个字");
      return;
    }
    setError("");

    // 按字数笔画用 charCode 近似；单字上卦=字码，下卦=字码+时辰
    // 两字以上：前半取上卦，后半取下卦，总笔画取动爻
    const codes = Array.from(chars).map((c) => c.charCodeAt(0));
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

    const changingLine = ((total % 6) || 6);
    const upperIdx = ((upperNum % 8) + 8) % 8 || 8;
    const lowerIdx = ((lowerNum % 8) + 8) % 8 || 8;

    const uIdx = upperIdx === 8 ? 7 : upperIdx - 1;
    const lIdx = lowerIdx === 8 ? 7 : lowerIdx - 1;

    const newLines = buildMeihuaLines(uIdx, lIdx, changingLine);
    setLines(newLines);
    setMeihuaResult({
      upper: TRIGRAM_NAMES[uIdx],
      lower: TRIGRAM_NAMES[lIdx],
      changingLine,
      upperIdx: uIdx,
      lowerIdx: lIdx,
      detail: `"${chars}" → 上卦数${upperNum} ÷ 8 余${upperNum % 8 || 8} = ${TRIGRAM_NAMES[uIdx]}；下卦数${lowerNum} ÷ 8 余${lowerNum % 8 || 8} = ${TRIGRAM_NAMES[lIdx]}；总数${total} ÷ 6 余${total % 6 || 6} → 动爻第${changingLine}爻`,
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
    setQuestion("示例：乾卦初九动");
  };

  const posLabels = ["初", "二", "三", "四", "五", "上"];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">起卦</h1>

      {/* Method tabs: 铜钱法 → 梅花易数 → 复盘 */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {([
          { key: "coin" as CastMethod, label: "铜钱法" },
          { key: "meihua" as CastMethod, label: "梅花易数" },
          { key: "manual" as CastMethod, label: "复盘" },
        ]).map((m) => (
          <button
            key={m.key}
            onClick={() => { setMethod(m.key); setError(""); setMeihuaResult(null); }}
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

      {/* ── 铜钱法 ── */}
      {method === "coin" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            三枚铜钱六次投掷。字面=3，花面=2。合计 6=老阴(动)、7=少阳、8=少阴、9=老阳(动)。
          </p>

          {coinThrows.length > 0 && (
            <div className="space-y-1">
              {coinThrows.map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-[var(--muted)]">{posLabels[i]}</span>
                  <span className="w-24 font-mono">
                    {t.coins.map((c) => (c === 3 ? "字" : "花")).join(" ")}
                  </span>
                  <span className="w-8 text-center">{t.total}</span>
                  <span className={t.changing ? "text-amber-600 font-medium" : ""}>
                    {coinLabel(t.total)}
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
                掷第{coinStep + 1}次（{posLabels[coinStep]}爻）
              </button>
              {coinStep > 0 && (
                <button onClick={resetCoin} className="px-4 py-2 border border-[var(--border)] rounded text-sm text-[var(--muted)]">
                  重来
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
              <button onClick={resetCoin} className="px-4 py-2 border border-[var(--border)] rounded text-sm text-[var(--muted)]">
                重来
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 梅花易数 ── */}
      {method === "meihua" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            梅花易数以数起卦，万物皆可为数。选择一种起卦方式：
          </p>

          {/* Sub-tabs */}
          <div className="flex gap-2">
            {([
              { key: "time" as const, label: "当下时间" },
              { key: "two_num" as const, label: "报二数" },
              { key: "word" as const, label: "文字起卦" },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => { setMeihuaMode(m.key); resetMeihua(); }}
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
              <p className="text-xs text-[var(--muted)]">
                以当前年月日时辰起卦。年+月+日 → 上卦，年+月+日+时辰 → 下卦，总数 ÷ 6 余数 → 动爻。
              </p>
              {!meihuaResult && (
                <button
                  onClick={castMeihuaByTime}
                  className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333]"
                >
                  以此刻起卦
                </button>
              )}
            </div>
          )}

          {meihuaMode === "two_num" && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">
                心中想好问题，随意报两个正整数。第一数 → 上卦，第二数 → 下卦，两数之和 ÷ 6 → 动爻。
              </p>
              <div className="flex gap-2 items-end">
                <input
                  type="number"
                  value={meihuaNum1}
                  onChange={(e) => setMeihuaNum1(e.target.value)}
                  placeholder="第一数"
                  min="1"
                  className="w-24 border border-[var(--border)] rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={meihuaNum2}
                  onChange={(e) => setMeihuaNum2(e.target.value)}
                  placeholder="第二数"
                  min="1"
                  className="w-24 border border-[var(--border)] rounded px-3 py-2 text-sm"
                />
                {!meihuaResult && (
                  <button
                    onClick={castMeihuaByNumbers}
                    className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333]"
                  >
                    起卦
                  </button>
                )}
              </div>
            </div>
          )}

          {meihuaMode === "word" && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">
                输入一个字或一组词。单字以字码取上卦、字码加时辰取下卦；多字前半取上、后半取下，总数取动爻。
              </p>
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  value={meihuaWord}
                  onChange={(e) => setMeihuaWord(e.target.value)}
                  placeholder="输入文字"
                  maxLength={20}
                  className="w-40 border border-[var(--border)] rounded px-3 py-2 text-sm"
                />
                {!meihuaResult && (
                  <button
                    onClick={castMeihuaByWord}
                    className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333]"
                  >
                    起卦
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
                  <p>上卦 <strong>{meihuaResult.upper}</strong>　下卦 <strong>{meihuaResult.lower}</strong></p>
                  <p>动爻：第 <strong className="text-amber-600">{meihuaResult.changingLine}</strong> 爻</p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">{meihuaResult.detail}</p>
              <button onClick={resetMeihua} className="text-xs text-[var(--muted)] underline">
                重新起卦
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 复盘 ── */}
      {method === "manual" && (
        <>
          <p className="text-sm text-[var(--muted)]">
            从下（初爻）往上（上爻）设定六爻的阴阳与动爻。适合已有起卦结果需要录入查看的情况。
          </p>
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
                    onChange={(v, c) => updateLine(pos, v, c)}
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
        <label className="text-sm text-[var(--muted)]">问题（可选）</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="你想问什么"
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
          {loading ? "演卦中…" : "演卦"}
        </button>
        {method === "manual" && (
          <button
            onClick={loadExample}
            type="button"
            className="px-4 py-2 border border-[var(--border)] rounded text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            载入示例
          </button>
        )}
      </div>
    </div>
  );
}
