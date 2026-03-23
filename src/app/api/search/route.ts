import { NextRequest, NextResponse } from "next/server";
import { getAllHexagrams } from "@/lib/data/hexagrams";

interface SearchHit {
  hexagramId: number;
  hexagramName: string;
  hexagramFullName: string;
  field: string;       // e.g. "guaCi", "yaoCi:3", "tuan", "xiang:overall", etc.
  layer: "经文" | "传文";
  label: string;
  content: string;
  matchSnippet: string;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ hits: [], query: q });
  }

  const all = getAllHexagrams();
  const hits: SearchHit[] = [];
  const maxHits = 50;

  for (const hex of all) {
    if (hits.length >= maxHits) break;

    const check = (
      field: string,
      layer: "经文" | "传文",
      label: string,
      content: string
    ) => {
      if (!content || hits.length >= maxHits) return;
      if (content.includes(q)) {
        const idx = content.indexOf(q);
        const start = Math.max(0, idx - 15);
        const end = Math.min(content.length, idx + q.length + 15);
        const snippet =
          (start > 0 ? "…" : "") +
          content.slice(start, end) +
          (end < content.length ? "…" : "");

        hits.push({
          hexagramId: hex.id,
          hexagramName: hex.name,
          hexagramFullName: hex.fullName,
          field,
          layer,
          label,
          content,
          matchSnippet: snippet,
        });
      }
    };

    check("guaCi", "经文", "卦辞", hex.guaCi);
    for (let pos = 1; pos <= 6; pos++) {
      check(`yaoCi:${pos}`, "经文", `第${pos}爻 爻辞`, hex.yaoCi[String(pos)] ?? "");
    }
    if (hex.yongCi) check("yongCi", "经文", hex.id === 1 ? "用九" : "用六", hex.yongCi);
    check("tuan", "传文", "彖传", hex.tuan);
    check("xiang:overall", "传文", "大象传", hex.xiang.overall);
    for (let pos = 1; pos <= 6; pos++) {
      check(`xiang:${pos}`, "传文", `第${pos}爻 小象`, hex.xiang.lines[String(pos)] ?? "");
    }
    if (hex.wenyan) check("wenyan", "传文", "文言", hex.wenyan);
    if (hex.xugua) check("xugua", "传文", "序卦传", hex.xugua);
    if (hex.zagua) check("zagua", "传文", "杂卦传", hex.zagua);
  }

  return NextResponse.json({ hits, query: q, total: hits.length });
}
