import { NextRequest, NextResponse } from "next/server"

export const GET = async (req: NextRequest) => {
  const ip =
    req.headers.get("x-envoy-external-address") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim()

  // Test the actual geojs.io call from Railway's server
  let geoResult: { status: number; body: string; error?: string } = {
    status: 0,
    body: "",
  }

  if (ip) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      const res = await fetch(`https://get.geojs.io/v1/ip/country/${ip}`, {
        signal: controller.signal,
        cache: "no-store",
      })

      clearTimeout(timeout)

      const body = await res.text()
      geoResult = { status: res.status, body: body.trim() }
    } catch (e: any) {
      geoResult = { status: 0, body: "", error: e.message || String(e) }
    }
  }

  return NextResponse.json({
    detectedIp: ip || "none",
    geoLookup: geoResult,
    relevantHeaders: {
      "x-real-ip": req.headers.get("x-real-ip"),
      "x-forwarded-for": req.headers.get("x-forwarded-for"),
    },
  })
}
