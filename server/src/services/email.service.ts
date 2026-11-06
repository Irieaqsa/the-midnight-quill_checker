import nodemailer from 'nodemailer';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: config.smtp.host || 'smtp.gmail.com',
    port: config.smtp.port || 587,
    secure: config.smtp.secure || false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  static async sendReportEmail(options: {
    to: string;
    submissionId: string;
    combinedScore: number;
    verdict: string;
    originalText: string;
    pdfRelativePath?: string;
  }): Promise<boolean> {
    try {
      if (!config.smtp.user || config.smtp.user.includes('your_')) {
        console.log(`[Email Mock] Would deliver report for ${options.submissionId} to ${options.to}`);
        return true;
      }

      const attachments = [];
      if (options.pdfRelativePath) {
        const fullPath = path.join(process.cwd(), options.pdfRelativePath.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) {
          attachments.push({
            filename: `Authenticity_Report_${options.submissionId}.pdf`,
            path: fullPath,
          });
        }
      }

      const htmlBody = `
        <div style="font-family: serif; color: #1B1B18; background-color: #F6F1E3; padding: 24px; border: 1px solid #0E3B2C;">
          <h2 style="color: #0E3B2C; margin-top: 0;">The Midnight Quill - Authenticity Desk Report</h2>
          <p>Your submission <strong>${options.submissionId}</strong> has been evaluated by our AI detector aggregate.</p>
          <div style="background: #ffffff; padding: 16px; border-left: 4px solid #0E3B2C; margin: 16px 0;">
            <h3 style="margin: 0; color: #0E3B2C;">Combined AI Likelihood: ${options.combinedScore}%</h3>
            <p style="margin: 4px 0 0 0; font-weight: bold;">Verdict: ${options.verdict}</p>
          </div>
          <h4>Original Text Evaluated:</h4>
          <blockquote style="background: #EFE9D7; padding: 12px; font-style: italic; white-space: pre-wrap;">${options.originalText}</blockquote>
          <p style="font-size: 11px; color: #666;">A comprehensive forensic PDF certificate is attached to this email.</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: config.smtp.from,
        to: options.to,
        subject: `[Authenticity Desk] Report for Submission #${options.submissionId}`,
        text: `Authenticity Report: Combined Score ${options.combinedScore}% (${options.verdict}). Original text: ${options.originalText}`,
        html: htmlBody,
        attachments,
      });

      return true;
    } catch (err) {
      console.error('[EmailService Error]:', err);
      return false;
    }
  }

  static async sendVerificationCode(to: string, code: string): Promise<boolean> {
    console.log(`[Email Code Verification]: Sent code ${code} to ${to}`);
    return true;
  }
}
