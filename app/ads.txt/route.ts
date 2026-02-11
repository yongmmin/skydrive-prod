import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const publisherId = client.startsWith("ca-pub-") ? client.replace("ca-pub-", "") : "";
  const body = publisherId
    ? `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# Set NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx to enable ads.txt\n";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
