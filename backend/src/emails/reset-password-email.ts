const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export function resetPasswordEmailHtml({ token }: { token: string }): string {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: 0 auto;">
  <h2>Password Reset</h2>
  <p>Click the link below to reset your password. This link expires in 1 hour.</p>
  <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
    Reset Password
  </a>
  <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
</body>
</html>`;
}
