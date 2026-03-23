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

type CastMethod = "manual" | "coin" | "number";

function coinLabel(total: number): string {
  switch (total) {
    case 6: return "⚋○ 老阴(动)";
    case 7: return "⚊  少阳";
    case 8: return "⚋  少阴";
    case 9: return "⚊○ 老阳(动)";
    default: return "?";
  }
}

export default function CastPage() {
  const router = useRouter();
  const [method, setMethod] = useState<CastMethod>("manual");
  const [lines, setLines] = useState<LineState[]>(
    Array.from({ length: 6 }, () => ({ value: 1, changing: false }))
  );
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Coin method state
  const [coinThrows, setCoinThrows] = useState<CoinThrow[]>([]);
  const [coinStep, setCoinStep] = useState(0); // 0-5 = which line, 6 = done

  // Number method state
  const [numberInput, setNumberInput] = useState("");

  const updateLine = (index: number, value: number, changing: boolean) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { value, changing };
      return next;
    });
  };

  const submitCast = async (castLines: LineState[]) => {
    setLoading(true);
    setError("");

    const payload = {
      method,
      question,
      lines: castLines.map((l, i) => ({
        position: i + 1,
        value: l.value,
        changing: l.changing,
      })),
    };

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

  // Coin throw
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

  // Number method
  const castByNumber = () => {
    const nums = numberInput.trim().split(/[\s,，]+/).map(Number).filter((n) => !isNaN(n));
    if (nums.length < 1) {
      setError("请输入至少一个数字");
      return;
    }

    // Use two numbers for upper/lower trigram
    let upper: number, lower: number;
    if (nums.length >= 2) {
      lower = nums[0];
      upper = nums[1];
    } else {
      lower = nums[0];
      upper = Math.floor(nums[0] / 8);
    }

    const trigramOrder = [
      [1, 1, 1], // 乾 0
      [1, 1, 0], // 兑 1
      [1, 0, 1], // 离 2
      [1, 0, 0], // 震 3
      [0, 1, 1], // 巽 4
      [0, 1, 0], // 坎 5
      [0, 0, 1], // 艮 6
      [0, 0, 0], // 坤 7
    ];

    const lowerIdx = ((lower % 8) + 8) % 8;
    const upperIdx = ((upper % 8) + 8) % 8;
    const lowerLines = trigramOrder[lowerIdx];
    const upperLines = trigramOrder[upperIdx];

    // Determine changing line from third number or sum
    const changingPos = nums.length >= 3 ? ((nums[2] % 6) + 1) : 0;

    const newLines: LineState[] = [
      ...lowerLines.map((v) => ({ value: v, changing: false })),
      ...upperLines.map((v) => ({ value: v, changing: false })),
    ];
    if (changingPos >= 1 && changingPos <= 6) {
      newLines[changingPos - 1].changing = true;
    }

    setLines(newLines);
    submitCast(newLines);
  };

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

      {/* Method tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(["manual", "coin", "number"] as CastMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMethod(m); setError(""); }}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              method === m
                ? "border-[#1a1a1a] font-medium"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {m === "manual" ? "手动输入" : m === "coin" ? "铜钱法" : "数字起卦"}
          </button>
        ))}
      </div>

      {/* Manual method */}
      {method === "manual" && (
        <>
          <p className="text-sm text-[var(--muted)]">
            从下（初爻）往上（上爻）设定六爻的阴阳与动爻。
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

      {/* Coin method */}
      {method === "coin" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            三枚铜钱六次投掷。字面=3，花面=2。合计6=老阴(动)、7=少阳、8=少阴、9=老阳(动)。
          </p>

          {/* Coin results table */}
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

      {/* Number method */}
      {method === "number" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            输入 2-3 个数字（逗号分隔）。第1个数→下卦，第2个数→上卦，第3个数→动爻位（可选）。数字对 8 取余映射八卦。
          </p>
          <input
            type="text"
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
            placeholder="例如：5, 3, 2"
            className="w-full max-w-sm border border-[var(--border)] rounded px-3 py-2 text-sm"
          />
        </div>
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
        {method === "number" ? (
          <button
            onClick={castByNumber}
            disabled={loading || !numberInput.trim()}
            className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333] disabled:opacity-50"
          >
            {loading ? "演卦中…" : "演卦"}
          </button>
        ) : (
          <button
            onClick={() => submitCast(lines)}
            disabled={loading || (method === "coin" && coinStep < 6)}
            className="px-5 py-2 bg-[#1a1a1a] text-white rounded text-sm hover:bg-[#333] disabled:opacity-50"
          >
            {loading ? "演卦中…" : "演卦"}
          </button>
        )}
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
