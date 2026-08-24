import { Resend } from 'resend';
import { env } from './env.js';

let resend: Resend | null = null;

if (env.RESEND_API_KEY) {
  resend = new Resend(env.RESEND_API_KEY);
}

function isDev(): boolean {
  return env.NODE_ENV !== 'production';
}

function getFromAddress(): string {
  return env.EMAIL_FROM || 'noreply@moodly.app';
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (isDev()) {
    console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[DEV EMAIL] Body:\n${html}`);
    return;
  }

  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email send');
    return;
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
