import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
