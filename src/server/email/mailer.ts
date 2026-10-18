import { Resend } from 'resend';

const DEFAULT_FROM = 'Novelty Wealth People <onboarding@resend.dev>';
const DEFAULT_REPLY_TO = 'people@noveltywealth.in';

interface SendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface SendResult {
  ok: boolean;
  id?: string | null;
  skipped?: boolean;
  error?: string;
}

export const mailer = {
  async send(input: SendInput): Promise<SendResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const overrideTo = process.env.EMAIL_OVERRIDE_TO;
    const to = overrideTo || input.to;
    const from = input.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;
    const replyTo = input.replyTo ?? process.env.EMAIL_REPLY_TO ?? DEFAULT_REPLY_TO;

    if (!apiKey) {
      console.log('[email] RESEND_API_KEY not set, dry-run →', {
        to,
        from,
        subject: input.subject,
      });
      return { ok: true, skipped: true };
    }

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo,
      });
      if (error) {
        console.error('[email] send failed:', error);
        return { ok: false, error: String(error) };
      }
      return { ok: true, id: data?.id ?? null };
    } catch (err) {
      console.error('[email] unexpected error:', err);
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
