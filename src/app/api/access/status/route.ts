import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/access/session";
import { getCapabilities, ROLE_NORMAL } from "@/lib/access/roles";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("access_token")
    ?? req.headers.get("x-access-token")
    ?? "";

  if (!token.trim()) {
    return NextResponse.json({
      role: ROLE_NORMAL,
      accessType: "normal",
      activated: false,
      capabilities: getCapabilities(ROLE_NORMAL),
    });
  }

  const session = getSession(token.trim());
  if (!session) {
    return NextResponse.json({
      role: ROLE_NORMAL,
      accessType: "normal",
      activated: false,
      capabilities: getCapabilities(ROLE_NORMAL),
    });
  }

  return NextResponse.json({
    accessToken: session.token,
    role: session.role,
    accessType: session.accessType,
    activated: session.activated,
    capabilities: getCapabilities(session.role),
    expiresAt: session.expiresAt,
  });
}
