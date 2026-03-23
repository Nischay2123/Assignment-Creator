interface BuildSignupOtpTemplateInput {
  name: string;
  otp: string;
  expiryMinutes: number;
}

interface SignupOtpEmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export const buildSignupOtpEmailTemplate = ({
  name,
  otp,
  expiryMinutes
}: BuildSignupOtpTemplateInput): SignupOtpEmailTemplate => {
  const subject = "Verify your email with OTP";
  const safeName = name.trim() || "there";

  const text = [
    `Hi ${safeName},`,
    "",
    "Use the OTP below to verify your email address:",
    otp,
    "",
    `This OTP expires in ${expiryMinutes} minutes.`,
    "If you did not request this, you can ignore this email."
  ].join("\n");

  const html = `
    <div style="font-family: Helvetica, Arial, sans-serif; background: #f5f7fb; padding: 24px; color: #0f172a;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="margin: 0 0 12px; font-size: 20px;">Verify your email</h2>
        <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6;">Hi ${safeName},</p>
        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6;">Use this one-time password to complete signup:</p>
        <div style="letter-spacing: 8px; font-size: 28px; font-weight: 700; text-align: center; background: #eff6ff; border: 1px dashed #60a5fa; border-radius: 10px; padding: 16px; margin: 0 0 18px;">
          ${otp}
        </div>
        <p style="margin: 0 0 8px; font-size: 13px; color: #334155;">This OTP expires in <strong>${expiryMinutes} minutes</strong>.</p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  return { subject, text, html };
};
