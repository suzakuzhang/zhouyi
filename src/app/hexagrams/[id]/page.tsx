"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HexagramSymbol from "@/components/HexagramSymbol";
import TextLayerLabel from "@/components/TextLayerLabel";

interface Hexagram {
  id: number;
  name: string;
  fullName: string;
  upperTrigram: string;
  lowerTrigram: string;
  lines: number[];
  section: string;
  guaCi: string;
  yaoCi: Record<string, string>;
  yongCi?: string;
  tuan: string;
  xiang: {
    overall: string;
    lines: Record<string, string>;
  };
  wenyan?: string;
  xugua?: string;
  zagua?: string;
}

const yaoNames = ["初", "二", "三", "四", "五", "上"];

export default function HexagramDetailPage() {
  const params = useParams();
  const [hex, setHex] = useState<Hexagram | null>(null);
  const [tab, setTab] = useState<"guaCi" | "yaoCi" | "tuan" | "xiang" | "wenyan" | "other">("guaCi");

  useEffect(() => {
    if (params.id) {
      fetch(`/api/hexagram/${params.id}`)
        .then((r) => r.json())
        .then((d) => setHex(d));
    }
  }, [params.id]);

  if (!hex) {
    return <p className="text-[var(--muted)]">加载中…</p>;
  }

  const tabs = [
    { key: "guaCi", label: "卦辞" },
    { key: "yaoCi", label: "爻辞" },
    { key: "tuan", label: "彖传" },
    { key: "xiang", label: "象传" },
    ...(hex.wenyan ? [{ key: "wenyan", label: "文言" }] : []),
    ...(hex.xugua || hex.zagua ? [{ key: "other", label: "序卦·杂卦" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <HexagramSymbol lines={hex.lines} size={80} />
        <div>
          <h1 className="text-2xl font-semibold">{hex.fullName}</h1>
          <p className="text-sm text-[var(--muted)]">
            第{hex.id}卦 · {hex.section} · {hex.lowerTrigram}下{hex.upperTrigram}上
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
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

      {/* Tab Content */}
      <div className="space-y-3">
        {tab === "guaCi" && (
          <div className="space-y-2">
            <TextLayerLabel layer="经文" />
            <p className="text-layer-jingwen text-sm leading-relaxed">{hex.guaCi}</p>
            {hex.yongCi && (
              <>
                <TextLayerLabel layer="经文" />
                <p className="text-layer-jingwen text-sm leading-relaxed">{hex.yongCi}</p>
              </>
            )}
          </div>
        )}

        {tab === "yaoCi" && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((pos) => (
              <div key={pos} className="space-y-1">
                <div className="flex items-center gap-2">
                  <TextLayerLabel layer="经文" />
                  <span className="text-xs text-[var(--muted)]">第{pos}爻 ({yaoNames[pos - 1]})</span>
                </div>
                <p className="text-layer-jingwen text-sm leading-relaxed">
                  {hex.yaoCi[String(pos)] ?? ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "tuan" && (
          <div className="space-y-2">
            <TextLayerLabel layer="传文" />
            <p className="text-layer-chuanwen text-sm leading-relaxed">{hex.tuan}</p>
          </div>
        )}

        {tab === "xiang" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TextLayerLabel layer="传文" />
                <span className="text-xs text-[var(--muted)]">大象</span>
              </div>
              <p className="text-layer-chuanwen text-sm leading-relaxed">{hex.xiang.overall}</p>
            </div>
            {[1, 2, 3, 4, 5, 6].map((pos) => {
              const text = hex.xiang.lines[String(pos)];
              if (!text) return null;
              return (
                <div key={pos} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TextLayerLabel layer="传文" />
                    <span className="text-xs text-[var(--muted)]">第{pos}爻 小象</span>
                  </div>
                  <p className="text-layer-chuanwen text-sm leading-relaxed">{text}</p>
                </div>
              );
            })}
          </div>
        )}

        {tab === "wenyan" && hex.wenyan && (
          <div className="space-y-2">
            <TextLayerLabel layer="传文" />
            <p className="text-layer-chuanwen text-sm leading-relaxed">{hex.wenyan}</p>
          </div>
        )}

        {tab === "other" && (
          <div className="space-y-4">
            {hex.xugua && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TextLayerLabel layer="传文" />
                  <span className="text-xs text-[var(--muted)]">序卦传</span>
                </div>
                <p className="text-layer-chuanwen text-sm leading-relaxed">{hex.xugua}</p>
              </div>
            )}
            {hex.zagua && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TextLayerLabel layer="传文" />
                  <span className="text-xs text-[var(--muted)]">杂卦传</span>
                </div>
                <p className="text-layer-chuanwen text-sm leading-relaxed">{hex.zagua}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[var(--border)]">
        <a href="/hexagrams" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] underline">
          返回六十四卦
        </a>
      </div>
    </div>
  );
}
