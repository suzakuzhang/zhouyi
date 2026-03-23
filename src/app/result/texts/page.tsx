"use client";

import { useEffect, useState } from "react";
import TextLayerLabel from "@/components/TextLayerLabel";

interface HexagramFull {
  id: number;
  name: string;
  fullName: string;
  guaCi: string;
  yaoCi: Record<string, string>;
  yongCi?: string;
  tuan: string;
  xiang: { overall: string; lines: Record<string, string> };
  wenyan?: string;
  xugua?: string;
  zagua?: string;
}

interface CastResultData {
  rawCastResult: {
    originalHexagram: HexagramFull;
    changedHexagram?: HexagramFull | null;
    changingLines: number[];
  };
}

const yaoNames = ["初", "二", "三", "四", "五", "上"];

type Tab = "guaCi" | "yaoCi" | "tuan" | "xiang" | "wenyan" | "other";

export default function TextsPage() {
  const [data, setData] = useState<CastResultData | null>(null);
  const [tab, setTab] = useState<Tab>("guaCi");

  useEffect(() => {
    const raw = sessionStorage.getItem("castResult");
    if (raw) setData(JSON.parse(raw));
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">文本对照</h1>
        <p className="text-[var(--muted)]">暂无数据。请先<a href="/cast" className="underline">起卦</a>。</p>
      </div>
    );
  }

  const hex = data.rawCastResult.originalHexagram;
  const changed = data.rawCastResult.changedHexagram;
  const changingLines = data.rawCastResult.changingLines;

  const tabs: { key: Tab; label: string }[] = [
    { key: "guaCi", label: "卦辞" },
    { key: "yaoCi", label: "爻辞" },
    { key: "tuan", label: "彖传" },
    { key: "xiang", label: "象传" },
    ...(hex.wenyan ? [{ key: "wenyan" as Tab, label: "文言" }] : []),
    ...(hex.xugua || hex.zagua ? [{ key: "other" as Tab, label: "序卦·杂卦" }] : []),
  ];

  const renderHexSection = (h: HexagramFull, label: string, isChanged: boolean) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--muted)]">{label}：{h.fullName}</h3>

      {tab === "guaCi" && (
        <div className="space-y-2">
          <TextLayerLabel layer="经文" />
          <p className="text-layer-jingwen text-sm leading-relaxed">{h.guaCi}</p>
          {h.yongCi && (
            <>
              <TextLayerLabel layer="经文" />
              <p className="text-layer-jingwen text-sm leading-relaxed">{h.yongCi}</p>
            </>
          )}
        </div>
      )}

      {tab === "yaoCi" && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((pos) => {
            const isChanging = !isChanged && changingLines.includes(pos);
            return (
              <div key={pos} className={`space-y-1 ${isChanging ? "bg-amber-50 -mx-2 px-2 py-1 rounded" : ""}`}>
                <div className="flex items-center gap-2">
                  <TextLayerLabel layer="经文" />
                  <span className="text-xs text-[var(--muted)]">
                    第{pos}爻 ({yaoNames[pos - 1]})
                    {isChanging && <span className="text-amber-600 ml-1">● 动</span>}
                  </span>
                </div>
                <p className="text-layer-jingwen text-sm leading-relaxed">
                  {h.yaoCi[String(pos)] ?? ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "tuan" && (
        <div className="space-y-2">
          <TextLayerLabel layer="传文" />
          <p className="text-layer-chuanwen text-sm leading-relaxed">{h.tuan}</p>
        </div>
      )}

      {tab === "xiang" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TextLayerLabel layer="传文" />
              <span className="text-xs text-[var(--muted)]">大象</span>
            </div>
            <p className="text-layer-chuanwen text-sm leading-relaxed">{h.xiang.overall}</p>
          </div>
          {[1, 2, 3, 4, 5, 6].map((pos) => {
            const text = h.xiang.lines[String(pos)];
            if (!text) return null;
            const isChanging = !isChanged && changingLines.includes(pos);
            return (
              <div key={pos} className={`space-y-1 ${isChanging ? "bg-amber-50 -mx-2 px-2 py-1 rounded" : ""}`}>
                <div className="flex items-center gap-2">
                  <TextLayerLabel layer="传文" />
                  <span className="text-xs text-[var(--muted)]">
                    第{pos}爻 小象
                    {isChanging && <span className="text-amber-600 ml-1">● 动</span>}
                  </span>
                </div>
                <p className="text-layer-chuanwen text-sm leading-relaxed">{text}</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "wenyan" && h.wenyan && (
        <div className="space-y-2">
          <TextLayerLabel layer="传文" />
          <p className="text-layer-chuanwen text-sm leading-relaxed">{h.wenyan}</p>
        </div>
      )}

      {tab === "other" && (
        <div className="space-y-4">
          {h.xugua && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TextLayerLabel layer="传文" />
                <span className="text-xs text-[var(--muted)]">序卦传</span>
              </div>
              <p className="text-layer-chuanwen text-sm leading-relaxed">{h.xugua}</p>
            </div>
          )}
          {h.zagua && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TextLayerLabel layer="传文" />
                <span className="text-xs text-[var(--muted)]">杂卦传</span>
              </div>
              <p className="text-layer-chuanwen text-sm leading-relaxed">{h.zagua}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">文本对照</h1>
        <a href="/result" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          返回结果
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#1a1a1a] text-[#1a1a1a] font-medium"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Original hexagram */}
      {renderHexSection(hex, "本卦", false)}

      {/* Changed hexagram (if present) */}
      {changed && (
        <div className="pt-4 border-t border-[var(--border)]">
          {renderHexSection(changed, "变卦", true)}
        </div>
      )}
    </div>
  );
}
