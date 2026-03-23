import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "@repo/logger";

import { env } from "../../config/env.js";
import { buildSignupOtpEmailTemplate } from "../templates/otp-email.template.js";

const mailLogger = logger.child({ module: "mail-service" });

interface SendSignupOtpEmailInput {
  to: string;
  name: string;
  otp: string;
  expiryMinutes: number;
}

class MailService {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS
            }
          : undefined
    });
  }

  async sendSignupOtpEmail({ to, name, otp, expiryMinutes }: SendSignupOtpEmailInput) {
    const template = buildSignupOtpEmailTemplate({
      name,
      otp,
      expiryMinutes
    });

    await this.transporter.sendMail({
      from: `${env.SMTP_FROM_NAME} <${env.SMTP_FROM_EMAIL}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });

    mailLogger.info("Signup OTP email sent", { to });
  }
}

export const mailService = new MailService();
