/**
 * Display-layer English localisation for the reading result.
 *
 * The reading engine emits Chinese (and that Chinese is what gets persisted to
 * the research corpus — we deliberately do NOT touch it). Here we re-express the
 * result for English readers at render time only:
 *   - 经文 (judgment / line / yong) text + labels → James Legge (public domain).
 *   - 传文 (彖 Tuan / 象 Image / 文言 Wenyan) → Legge's appendixes I/II/IV, also
 *     public domain (extracted from ctext.org 2026-06-06), same translator voice.
 *   - reading-strategy rationale + dynamic/static relation → faithful English
 *     re-statements of the engine's rule templates.
 */
import { hexEn, hexNameEn } from "./hexEn";

type RefKind =
  | { kind: "guaCi"; id: number }
  | { kind: "line"; id: number; pos: number }
  | { kind: "yongCi"; id: number }
  | { kind: "tuan"; id: number }
  | { kind: "xiangOverall"; id: number }
  | { kind: "xiangLine"; id: number; pos: number }
  | { kind: "unknown" };

function parseRef(ref: string): RefKind {
  const p = ref.split(":");
  // hexagram:{id}:...
  if (p[0] !== "hexagram") return { kind: "unknown" };
  const id = Number(p[1]);
  if (!id) return { kind: "unknown" };
  if (p[2] === "guaCi") return { kind: "guaCi", id };
  if (p[2] === "yongCi") return { kind: "yongCi", id };
  if (p[2] === "tuan") return { kind: "tuan", id };
  if (p[2] === "line") return { kind: "line", id, pos: Number(p[3]) };
  if (p[2] === "xiang" && p[3] === "overall") return { kind: "xiangOverall", id };
  if (p[2] === "xiang" && p[3] === "line") return { kind: "xiangLine", id, pos: Number(p[4]) };
  return { kind: "unknown" };
}

const ORD = ["first", "second", "third", "fourth", "fifth", "top"];
const lineName = (pos: number) => (pos === 6 ? "top line" : `${ORD[pos - 1]} line`);

/** English label for a text reference; falls back to the Chinese label. */
export function enTextLabel(ref: string, zhLabel: string): string {
  const r = parseRef(ref);
  if (r.kind === "unknown") return zhLabel;
  const name = hexNameEn(r.id) || zhLabel;
  switch (r.kind) {
    case "guaCi":
      return `${name}, Judgment`;
    case "line":
      return `${name}, ${lineName(r.pos)}`;
    case "yongCi":
      return `${name}, ${r.id === 1 ? "Nine" : "Six"} throughout`;
    case "tuan":
      return `${name}, Tuan commentary`;
    case "xiangOverall":
      return `${name}, Great Image`;
    case "xiangLine":
      return `${name}, Small Image (${lineName(r.pos)})`;
  }
}

/** English body (Legge) for 经文 refs; null when no English source exists (传文). */
export function enTextContent(ref: string): string | null {
  const r = parseRef(ref);
  if (r.kind === "unknown") return null;
  const data = hexEn(r.id);
  if (!data) return null;
  switch (r.kind) {
    case "guaCi":
      return data.judgment_en ?? null;
    case "line":
      return data.lines_en?.[String(r.pos)] ?? null;
    case "yongCi":
      return data.yong_en ?? null;
    case "tuan":
      return data.tuan_en ?? null;
    case "xiangOverall":
      return data.xiang_overall_en ?? null;
    case "xiangLine":
      return data.xiang_line_en?.[String(r.pos)] ?? null;
    default:
      return null;
  }
}

function listAnd(nums: number[]): string {
  if (nums.length <= 1) return nums.join("");
  if (nums.length === 2) return `${nums[0]} and ${nums[1]}`;
  return `${nums.slice(0, -1).join(", ")} and ${nums[nums.length - 1]}`;
}

/** English re-statement of the reading-strategy rationale. */
export function enRationale(
  policyName: string,
  count: number,
  changingLines: number[],
  originalId: number,
  hasChanged: boolean
): string {
  const sorted = [...changingLines].sort((a, b) => a - b);
  const compatible = policyName === "compatible";

  if (count === 0) {
    return compatible
      ? "No changing lines — read the primary hexagram's judgment. (Compatible policy matches the classic here.)"
      : "No changing lines — read the hexagram's judgment, with the Tuan and Great Image commentaries for reference.";
  }
  if (count === 1) {
    const pos = sorted[0];
    return compatible
      ? `One changing line (line ${pos}) — read that line's statement. (Compatible policy matches the classic.)`
      : `One changing line (line ${pos}) — read that line's statement.`;
  }
  if (count === 2) {
    return compatible
      ? `Two changing lines (lines ${listAnd(sorted)}) — read both with equal weight, plus the changed hexagram's judgment.`
      : `Two changing lines (lines ${listAnd(sorted)}) — the upper one (line ${sorted[1]}) leads; read both.`;
  }
  if (count === 3) {
    return compatible
      ? "Three changing lines — read both judgments and all three changing-line statements together."
      : "Three changing lines — read the judgments of both the primary and the changed hexagram.";
  }
  if (count === 4) {
    return compatible
      ? "Four changing lines — read both judgments together, with the changing-line statements as support."
      : "Four changing lines — emphasis on the changed hexagram; consult its unchanging lines.";
  }
  if (count === 5) {
    const staticLine = ([1, 2, 3, 4, 5, 6] as number[]).find((p) => !sorted.includes(p));
    return compatible
      ? "Five changing lines — read both judgments together, with the changing-line statements as support."
      : `Five changing lines — read the single unchanging line (line ${staticLine}) of the changed hexagram.`;
  }
  // count === 6
  if (compatible) return "All six lines changing — read both judgments together.";
  if (originalId === 1) return "All six lines changing (Qian) — read the “Nine throughout” (yong jiu).";
  if (originalId === 2) return "All six lines changing (Kun) — read the “Six throughout” (yong liu).";
  return hasChanged
    ? "All six lines changing — read the changed hexagram's judgment, with the primary's for support."
    : "All six lines changing — read the primary hexagram's judgment.";
}

/** English re-statement of the dynamic/static relation. */
export function enDynamicStatic(changingLines: number[]): string {
  const n = changingLines.length;
  if (n === 0) return "All still — no changing lines.";
  if (n === 6) return "All moving — every line changes.";
  const sorted = [...changingLines].sort((a, b) => a - b);
  return `${n} changing, ${6 - n} still. Changing lines: ${sorted.join(", ")}.`;
}
