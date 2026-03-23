import { NextRequest, NextResponse } from "next/server";
import { getHexagramById } from "@/lib/data/hexagrams";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id) || id < 1 || id > 64) {
    return NextResponse.json({ error: "卦序须为 1-64" }, { status: 400 });
  }

  const hex = getHexagramById(id);
  if (!hex) {
    return NextResponse.json({ error: `未找到第 ${id} 卦` }, { status: 404 });
  }

  return NextResponse.json(hex);
}
