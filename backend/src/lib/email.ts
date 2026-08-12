import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || 'noreply@moodly.app';
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
