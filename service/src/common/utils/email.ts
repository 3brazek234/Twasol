import { Resend } from 'resend';
import { env } from '../../env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
  
  if (error) {
    // Log but don't throw — a failed email should not crash the request.
    // The user gets a generic success message regardless (security).
    console.error('[Email] Failed to send:', error);
  }
}

export function buildOtpEmailHtml(otp: string): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background: #F8F9FA; padding: 40px;">
      <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 32px; border: 1px solid #E2E8F0;">
        <h1 style="color: #1B2A4A; font-size: 24px; margin-bottom: 8px;">
          وكيل — منصة التوكيل القانوني
        </h1>
        <p style="color: #4A5568; font-size: 16px;">
          لقد طلبت إعادة تعيين كلمة المرور لحسابك.
        </p>
        <p style="color: #4A5568; font-size: 16px;">
          استخدم الرمز التالي لإعادة تعيين كلمة المرور:
        </p>
        <div style="background: #F0F4FF; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 40px; font-weight: bold; color: #1B2A4A; letter-spacing: 8px;">
            ${otp}
          </span>
        </div>
        <p style="color: #718096; font-size: 14px;">
          ينتهي هذا الرمز خلال <strong>10 دقائق</strong>.
        </p>
        <p style="color: #718096; font-size: 14px;">
          إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد الإلكتروني. حسابك بأمان.
        </p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="color: #A0AEC0; font-size: 12px; text-align: center;">
          وكيل — منصة قانونية موثوقة للمحامين المصريين
        </p>
      </div>
    </body>
    </html>
  `;
}
