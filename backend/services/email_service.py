import httpx
import os
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "AgriSen <onboarding@resend.dev>")


def send_otp_email(email: str, otp_code: str):
    """Send OTP email via Resend HTTP API (works on Railway - no SMTP ports needed)."""

    if not RESEND_API_KEY:
        # No API key — fall back to console log (local dev only)
        print(f"\n========================================")
        print(f"[SIMULATED EMAIL] OTP for {email} is: {otp_code}")
        print(f"========================================\n")
        return

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": EMAIL_FROM,
                "to": [email],
                "subject": "Your AgriSen Verification Code",
                "html": f"""
                    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
                        <h2 style="color:#16a34a;margin-bottom:8px;">AgriSen OTP Verification</h2>
                        <p style="color:#374151;">Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>
                        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111827;margin:24px 0;text-align:center;">
                            {otp_code}
                        </div>
                        <p style="color:#6b7280;font-size:13px;">If you did not request this, please ignore this email.</p>
                    </div>
                """,
            },
            timeout=10,
        )
        if response.status_code == 200:
            print(f"[AgriSen] OTP email sent successfully to {email}")
        else:
            print(f"[AgriSen] Resend API error ({response.status_code}): {response.text}")
            print(f"[SIMULATED EMAIL] OTP for {email} is: {otp_code}")

    except Exception as e:
        print(f"[AgriSen] Failed to send email to {email}: {e}")
        print(f"[SIMULATED EMAIL] OTP for {email} is: {otp_code}")

