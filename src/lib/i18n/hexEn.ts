/**
 * Lookup into the public-domain English hexagram corpus (James Legge, 1882,
 * Sacred Books of the East vol. 16, verbatim from ctext.org). Hexagram names
 * are modern pinyin; judgment/line bodies are Legge's text.
 *
 * Used to surface English hexagram names and classic-text (经文) bodies when
 * the active locale is "en". Commentary layers (传文: 彖/象/文言) are not
 * covered by this corpus.
 */
import enData from "@/data/hexagrams_en.json";

export interface HexEn {
  name_en: string;
  judgment_en: string;
  lines_en: Record<string, string>;
  yong_en?: string;
  // 传文 (Legge appendixes I/II/IV, public domain) — added 2026-06-06
  tuan_en?: string;
  xiang_overall_en?: string;
  xiang_line_en?: Record<string, string>;
  wenyan_en?: string;
}

const map = enData as Record<string, HexEn | string>;

export function hexEn(id: number): HexEn | null {
  const v = map[String(id)];
  return v && typeof v === "object" ? v : null;
}

export function hexNameEn(id: number): string {
  return hexEn(id)?.name_en ?? "";
}
