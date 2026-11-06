import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { QueueService, submissionEvents } from '../services/queue.service';
import { countWords } from '../utils/textProcessor';
import path from 'path';
import fs from 'fs';

const router = Router();

// Submit text for analysis
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, deliveryEmail, deliveryWhatsapp, deliveryEmailAddress } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text cannot be empty.' });
      return;
    }

    const wordCount = countWords(text);
    if (wordCount > 10000) {
      res.status(400).json({ error: 'Text exceeds maximum limit of 10,000 words.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || user.quotaRemaining <= 0) {
      res.status(403).json({ error: 'Submission quota exhausted. Please contact admin for credit expansion.' });
      return;
    }

    // Check delivery options
    if (!deliveryEmail && !deliveryWhatsapp) {
      res.status(400).json({ error: 'At least one delivery channel (Email or WhatsApp) must be selected.' });
      return;
    }

    const textHash = crypto.createHash('sha256').update(text.trim()).digest('hex');

    // Deduct quota
    await prisma.user.update({
      where: { id: user.id },
      data: { quotaRemaining: { decrement: 1 } },
    });

    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        text,
        textHash,
        wordCount,
        sourceType: 'PASTE',
        status: 'QUEUED',
        deliveryEmail: Boolean(deliveryEmail),
        deliveryWhatsapp: Boolean(deliveryWhatsapp),
        deliveryEmailAddress: deliveryEmailAddress || user.email,
      },
    });

    // Start background processing
    QueueService.processSubmissionAsync(submission.id);

    res.status(202).json({
      message: 'Submission accepted for multi-detector aggregation.',
      submissionId: submission.id,
      wordCount,
      status: 'QUEUED',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User's own submission history
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { query, verdict, status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };

    if (status) where.status = status;
    if (query) {
      where.text = { contains: String(query) };
    }
    if (verdict) {
      where.report = { verdict: String(verdict) };
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          report: true,
          providerResults: {
            select: {
              provider: true,
              aiScore: true,
              label: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({
      submissions,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific submission details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        // If not admin, restrict to own
        ...(req.user!.role !== 'ADMIN' ? { userId: req.user!.userId } : {}),
      },
      include: {
        report: {
          include: { deliveries: true },
        },
        providerResults: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found or unauthorized' });
      return;
    }

    res.json({ submission });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SSE Live Status Events
router.get('/:id/events', authenticate, (req: Request, res: Response): void => {
  const submissionId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onStatusChange = (data: any) => {
    res.write(`event: status\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onDetectorChange = (data: any) => {
    res.write(`event: detector\ndata: ${JSON.stringify(data)}\n\n`);
  };

  submissionEvents.on(`status:${submissionId}`, onStatusChange);
  submissionEvents.on(`detector:${submissionId}`, onDetectorChange);

  req.on('close', () => {
    submissionEvents.off(`status:${submissionId}`, onStatusChange);
    submissionEvents.off(`detector:${submissionId}`, onDetectorChange);
  });
});

// Download PDF
router.get('/:id/report.pdf', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        ...(req.user!.role !== 'ADMIN' ? { userId: req.user!.userId } : {}),
      },
      include: { report: true },
    });

    if (!submission || !submission.report?.pdfUrl) {
      res.status(404).json({ error: 'PDF report not generated yet.' });
      return;
    }

    const filePath = path.join(process.cwd(), submission.report.pdfUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found on storage disk.' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="TMQ_Report_${submission.id}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
