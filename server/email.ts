import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(toEmail: string, code: string): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Furry Assistant 1 <noreply@furryassistant1.com>',
      to: toEmail,
      subject: 'Reset Your Furry Assistant 1 Password',
      text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #f97316; margin: 0;">Furry Assistant 1</h1>
            <p style="color: #666; margin-top: 8px;">Your Pet Care Companion</p>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; text-align: center;">
            <p style="margin: 0 0 16px 0; color: #374151;">Your password reset code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${code}
            </div>
            <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
              This code expires in 15 minutes.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log(`Password reset email sent to ${toEmail}, id: ${data?.id}`);
    return true;
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}
