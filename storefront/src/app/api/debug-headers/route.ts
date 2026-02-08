import { NextRequest, NextResponse } from "next/server"

export const GET = (req: NextRequest) => {
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  const ip =
    req.headers.get("x-envoy-external-address") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim()

  return NextResponse.json({
    detectedIp: ip || "none",
    relevantHeaders: {
      "x-envoy-external-address": req.headers.get("x-envoy-external-address"),
      "x-real-ip": req.headers.get("x-real-ip"),
      "x-forwarded-for": req.headers.get("x-forwarded-for"),
      "x-vercel-ip-country": req.headers.get("x-vercel-ip-country"),
      "cf-ipcountry": req.headers.get("cf-ipcountry"),
    },
    allHeaders: headers,
  })
}
