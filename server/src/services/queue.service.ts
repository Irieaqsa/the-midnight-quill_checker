import prisma from '../config/database';
import { detectorAdapters, DetectorResult } from './detector.service';
import { ReportService } from './report.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { calculateCombinedScore, determineVerdict, calculateAgreement } from '../utils/scoring';
import EventEmitter from 'events';

export const submissionEvents = new EventEmitter();

export class QueueService {
  static async processSubmissionAsync(submissionId: string): Promise<void> {
    // Run asynchronously without blocking HTTP response
    setImmediate(async () => {
      try {
        const submission = await prisma.submission.findUnique({
          where: { id: submissionId },
          include: { user: true },
        });

        if (!submission) return;

        // 1. Update status to RUNNING
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'RUNNING' },
        });
        submissionEvents.emit(`status:${submissionId}`, { status: 'RUNNING' });

        // 2. Fetch enabled providers
        const enabledProviders = await prisma.provider.findMany({
          where: { enabled: true },
        });

        const activeProviders = enabledProviders.length > 0
          ? enabledProviders
          : [
              { id: '0', name: 'TMQ_SPECIAL', weight: 1.5 },
              { id: '1', name: 'GPTZERO', weight: 1.0 },
              { id: '2', name: 'COPYLEAKS', weight: 1.0 },
              { id: '3', name: 'SAPLING', weight: 1.0 },
              { id: '4', name: 'ORIGINALITY', weight: 1.0 },
              { id: '5', name: 'WINSTON', weight: 1.0 },
            ];

        // Ensure TMQ_SPECIAL is always included in evaluation
        if (!activeProviders.some(p => p.name === 'TMQ_SPECIAL')) {
          activeProviders.unshift({ id: 'tmq_special_auto', name: 'TMQ_SPECIAL', weight: 1.5 } as any);
        }

        // 3. Run detectors in parallel
        const promises = activeProviders.map(async (p) => {
          const adapter = detectorAdapters[p.name];
          if (!adapter) return null;

          submissionEvents.emit(`detector:${submissionId}`, {
            provider: p.name,
            status: 'RUNNING',
          });

          const result: DetectorResult = await adapter.detect(submission.text);

          const saved = await prisma.providerResult.create({
            data: {
              submissionId: submission.id,
              provider: p.name,
              status: result.status,
              aiScore: result.aiScore,
              label: result.label,
              sentenceData: result.sentenceData ? JSON.stringify(result.sentenceData) : null,
              rawResponse: result.raw ? JSON.stringify(result.raw) : null,
              latencyMs: result.latencyMs,
              cost: result.cost,
            },
          });

          submissionEvents.emit(`detector:${submissionId}`, {
            provider: p.name,
            status: result.status,
            aiScore: result.aiScore,
            label: result.label,
          });

          return { ...saved, weight: p.weight };
        });

        const results = (await Promise.all(promises)).filter(Boolean);

        // 4. Calculate Aggregate Metrics
        const successful = results.filter((r) => r && r.status === 'OK' && typeof r.aiScore === 'number');
        const scores = successful.map((r) => r!.aiScore!);
        const weights = successful.map((r) => r!.weight);

        const combinedScore = calculateCombinedScore(scores, weights);
        const verdict = determineVerdict(combinedScore);
        const agreement = calculateAgreement(scores);

        // 5. Generate PDF
        const pdfUrl = await ReportService.generatePDF({
          submissionId: submission.id,
          createdAt: submission.createdAt.toISOString(),
          wordCount: submission.wordCount,
          userName: submission.user?.name || 'Anonymous User',
          combinedScore,
          verdict,
          agreement,
          detectorResults: results.map((r) => ({
            provider: r!.provider,
            aiScore: r!.aiScore || 0,
            label: r!.label || 'UNKNOWN',
            status: r!.status,
          })),
          originalText: submission.text,
        });

        // 6. Save Report
        const report = await prisma.report.create({
          data: {
            submissionId: submission.id,
            combinedScore,
            verdict,
            agreement,
            pdfUrl,
          },
        });

        // 7. Deliveries
        if (submission.deliveryEmail) {
          const targetEmail = submission.deliveryEmailAddress || submission.user.email;
          const emailSent = await EmailService.sendReportEmail({
            to: targetEmail,
            submissionId: submission.id,
            combinedScore,
            verdict,
            originalText: submission.text,
            pdfRelativePath: pdfUrl,
          });

          await prisma.delivery.create({
            data: {
              reportId: report.id,
              channel: 'EMAIL',
              destination: targetEmail,
              status: emailSent ? 'DELIVERED' : 'FAILED',
              sentAt: new Date(),
            },
          });
        }

        if (submission.deliveryWhatsapp && submission.user.whatsappNumber) {
          const waResult = await WhatsAppService.sendReportNotification({
            to: submission.user.whatsappNumber,
            submissionId: submission.id,
            combinedScore,
            verdict,
            pdfUrl,
          });

          await prisma.delivery.create({
            data: {
              reportId: report.id,
              channel: 'WHATSAPP',
              destination: submission.user.whatsappNumber,
              status: waResult.success ? 'DELIVERED' : 'FAILED',
              providerMessageId: waResult.messageId,
              error: waResult.error,
              sentAt: new Date(),
            },
          });
        }

        // 8. Update submission to COMPLETE
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: 'COMPLETE',
            completedAt: new Date(),
          },
        });

        submissionEvents.emit(`status:${submissionId}`, {
          status: 'COMPLETE',
          reportId: report.id,
          combinedScore,
          verdict,
        });
      } catch (err: any) {
        console.error(`[Processing Error for submission ${submissionId}]:`, err);
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'FAILED' },
        });
        submissionEvents.emit(`status:${submissionId}`, { status: 'FAILED', error: err.message });
      }
    });
  }
}
