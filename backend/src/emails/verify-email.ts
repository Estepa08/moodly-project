const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export function verifyEmailHtml({ token }: { token: string }): string {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: 0 auto;">
  <h2>Welcome to Moodly</h2>
  <p>Please confirm your email address by clicking the link below.</p>
  <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
    Verify Email
  </a>
  <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
</body>
</html>`;
}
