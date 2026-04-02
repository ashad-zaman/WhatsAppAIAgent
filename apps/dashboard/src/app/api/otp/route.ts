import { NextResponse } from "next/server";
import crypto from "crypto";

const otpStore = new Map<
  string,
  { otp: string; expiresAt: number; attempts: number }
>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, action } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.replace(/\D/g, "");

    if (action === "send") {
      const existing = otpStore.get(normalizedPhone);
      if (existing && existing.expiresAt > Date.now()) {
        const waitTime = Math.ceil((existing.expiresAt - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${waitTime} seconds before requesting another OTP`,
          },
          { status: 429 },
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      otpStore.set(normalizedPhone, { otp, expiresAt, attempts: 0 });

      console.log(`OTP for ${normalizedPhone}: ${otp}`);

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        expiresAt,
      });
    }

    if (action === "verify") {
      const { otp } = body;
      if (!otp) {
        return NextResponse.json({ error: "OTP required" }, { status: 400 });
      }

      const stored = otpStore.get(normalizedPhone);

      if (!stored) {
        return NextResponse.json(
          { error: "No OTP found. Please request OTP first." },
          { status: 400 },
        );
      }

      if (stored.expiresAt < Date.now()) {
        otpStore.delete(normalizedPhone);
        return NextResponse.json(
          { error: "OTP expired. Please request new OTP." },
          { status: 400 },
        );
      }

      if (stored.attempts >= 3) {
        return NextResponse.json(
          { error: "Too many attempts. Please request new OTP." },
          { status: 400 },
        );
      }

      if (stored.otp !== otp) {
        stored.attempts++;
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      }

      otpStore.delete(normalizedPhone);

      const sessionToken = crypto.randomBytes(32).toString("hex");

      return NextResponse.json({
        success: true,
        verified: true,
        sessionToken,
        message: "Phone verified successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("OTP error:", error);
    return NextResponse.json(
      { error: "Failed to process OTP" },
      { status: 500 },
    );
  }
}
