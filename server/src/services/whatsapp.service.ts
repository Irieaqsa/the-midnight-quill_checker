import axios from 'axios';
import { config } from '../config';

export class WhatsAppService {
  static async sendReportNotification(options: {
    to: string;
    submissionId: string;
    combinedScore: number;
    verdict: string;
    pdfUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!config.whatsapp.accessToken || config.whatsapp.accessToken.includes('your_')) {
        console.log(`[WhatsApp Mock] Sending message to ${options.to} for submission #${options.submissionId}. Score: ${options.combinedScore}% (${options.verdict})`);
        return { success: true, messageId: `mock_wa_${Date.now()}` };
      }

      const formattedNumber = options.to.replace(/\D/g, '');
      const url = `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'text',
          text: {
            body: `*The Midnight Quill - Authenticity Desk*\nYour submission #${options.submissionId} check is complete.\n\nCombined AI Score: *${options.combinedScore}%*\nVerdict: *${options.verdict}*\n\nView the full detailed report in your dashboard or check your registered email for the forensic PDF slip.`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${config.whatsapp.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (err: any) {
      console.error('[WhatsAppService Error]:', err?.response?.data || err.message);
      return {
        success: false,
        error: err?.response?.data?.error?.message || err.message,
      };
    }
  }

  static async sendVerificationCode(to: string, code: string): Promise<boolean> {
    console.log(`[WhatsApp OTP] Sending verification code ${code} to ${to}`);
    return true;
  }
}
