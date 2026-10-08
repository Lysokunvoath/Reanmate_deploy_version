type OTPEmailType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

interface SendOTPEmailInput {
  email: string;
  otp: string;
  type: OTPEmailType;
}

function subjectFor(type: OTPEmailType): string {
  if (type === 'forget-password') return 'Reset your ReanMate password';
  if (type === 'change-email') return 'Confirm your new ReanMate email';
  return 'Your ReanMate sign-in code';
}

function textFor({ otp, type }: SendOTPEmailInput): string {
  const action = type === 'email-verification' ? 'verify your email' : 'sign in';
  return `Use this code to ${action} to ReanMate: ${otp}\n\nThis code expires in 5 minutes.`;
}

export async function sendOTPEmail(input: SendOTPEmailInput): Promise<void> {
  if (process.env.AUTH_EMAIL_DELIVERY === 'console') {
    console.info(`[ReanMate auth code] ${input.email}: ${input.otp}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY and AUTH_EMAIL_FROM are required to send auth codes.');
    }
    console.info(`[ReanMate auth code] ${input.email}: ${input.otp}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.email,
      subject: subjectFor(input.type),
      text: textFor(input),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send auth code: ${response.status}`);
  }
}
