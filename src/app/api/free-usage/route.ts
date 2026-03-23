import { NextResponse } from "next/server";
import { getFreeUsage } from "@/lib/access/session";

export async function GET() {
  return NextResponse.json(getFreeUsage());
}
