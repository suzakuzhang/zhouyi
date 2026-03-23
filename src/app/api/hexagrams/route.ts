import { NextResponse } from "next/server";
import { getAllHexagrams } from "@/lib/data/hexagrams";

export async function GET() {
  const all = getAllHexagrams();
  const index = all.map((h) => ({
    id: h.id,
    name: h.name,
    fullName: h.fullName,
    upperTrigram: h.upperTrigram,
    lowerTrigram: h.lowerTrigram,
    section: h.section,
  }));
  return NextResponse.json({ hexagrams: index });
}
