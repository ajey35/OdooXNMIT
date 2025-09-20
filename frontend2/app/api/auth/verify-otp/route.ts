import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 })
    }

    // In production, verify against stored OTP in database
    console.log(`[v0] Verifying OTP ${otp} for email: ${email}`)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // For demo purposes, accept any 6-digit OTP
    if (otp.length !== 6) {
      return NextResponse.json({ success: false, message: "Invalid OTP format" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    })
  } catch (error) {
    console.error("[v0] OTP verification error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
