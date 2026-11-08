import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Ensure all routes require Admin role
router.use(authenticate, requireAdmin);

// Dashboard overview metrics
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalSubmissions, totalUsers, reports, recentSubmissions] = await Promise.all([
      prisma.submission.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.report.findMany({ select: { combinedScore: true, verdict: true } }),
      prisma.submission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          report: true,
        },
      }),
    ]);

    const avgScore = reports.length > 0
      ? Math.round(reports.reduce((acc, r) => acc + r.combinedScore, 0) / reports.length)
      : 0;

    const verdictDistribution = {
      human: reports.filter((r) => r.verdict === 'LIKELY_HUMAN').length,
      mixed: reports.filter((r) => r.verdict === 'MIXED').length,
      ai: reports.filter((r) => r.verdict === 'LIKELY_AI').length,
    };

    res.json({
      stats: {
        totalSubmissions,
        totalUsers,
        avgScore,
        verdictDistribution,
      },
      recentSubmissions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// All submissions across the platform
router.get('/submissions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, verdict, status, page = '1', limit = '15', search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) where.userId = String(userId);
    if (status) where.status = String(status);
    if (search) where.text = { contains: String(search) };
    if (verdict) where.report = { verdict: String(verdict) };

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          report: { include: { deliveries: true } },
          providerResults: { select: { provider: true, aiScore: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.submission.count({ where }),
    ]);

    // Record audit log for admin inspection
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'VIEW_ALL_SUBMISSIONS',
          ip: req.ip || '127.0.0.1',
        },
      });
    }

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

// Admin view single submission (audited)
router.get('/submissions/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: true,
        report: { include: { deliveries: true } },
        providerResults: true,
      },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Write audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'READ_SUBMISSION_TEXT',
          targetType: 'SUBMISSION',
          targetId: submission.id,
          ip: req.ip || '127.0.0.1',
        },
      });
    }

    res.json({ submission });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export
router.get('/export.csv', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        user: { select: { email: true, name: true } },
        report: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    let csv = 'ID,Date,User Name,User Email,Word Count,Status,Combined Score,Verdict\n';
    submissions.forEach((s) => {
      const date = s.createdAt.toISOString();
      const score = s.report ? s.report.combinedScore : 'N/A';
      const verdict = s.report ? s.report.verdict : 'N/A';
      csv += `"${s.id}","${date}","${s.user.name}","${s.user.email}",${s.wordCount},"${s.status}",${score},"${verdict}"\n`;
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'EXPORT_CSV',
          targetType: 'SUBMISSIONS',
          ip: req.ip || '127.0.0.1',
        },
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="TMQ_All_Submissions_Export.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List users & manage quotas/status
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        quotaRemaining: true,
        status: true,
        whatsappNumber: true,
        whatsappVerifiedAt: true,
        createdAt: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { quotaRemaining, status, role } = req.body;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(quotaRemaining !== undefined ? { quotaRemaining: Number(quotaRemaining) } : {}),
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'UPDATE_USER',
          targetType: 'USER',
          targetId: updated.id,
          ip: req.ip || '127.0.0.1',
        },
      });
    }

    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Providers control
router.get('/providers', async (req: Request, res: Response): Promise<void> => {
  try {
    let providers = await prisma.provider.findMany();
    if (providers.length === 0) {
      // Auto seed defaults
      const defaults = [
        { name: 'GPTZERO', weight: 1.0, health: 'HEALTHY' },
        { name: 'COPYLEAKS', weight: 1.0, health: 'HEALTHY' },
        { name: 'SAPLING', weight: 1.0, health: 'HEALTHY' },
        { name: 'ORIGINALITY', weight: 1.0, health: 'HEALTHY' },
        { name: 'WINSTON', weight: 1.0, health: 'HEALTHY' },
      ];
      for (const d of defaults) {
        await prisma.provider.upsert({
          where: { name: d.name },
          update: {},
          create: d,
        });
      }
      providers = await prisma.provider.findMany();
    }
    res.json({ providers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/providers/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { enabled, weight, health } = req.body;
    const updated = await prisma.provider.update({
      where: { id },
      data: {
        ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
        ...(weight !== undefined ? { weight: parseFloat(weight) } : {}),
        ...(health ? { health } : {}),
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'UPDATE_DETECTOR_PROVIDER',
          targetType: 'PROVIDER',
          targetId: updated.name,
          ip: req.ip || '127.0.0.1',
        },
      });
    }

    res.json({ provider: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear overall history with filter option (Admin only)
router.delete('/submissions/clear-all', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { filter, beforeDate, afterDate } = req.query;

    const where: any = {};
    const now = new Date();

    if (filter === 'before_7_weeks') {
      const targetDate = new Date(now.getTime() - 7 * 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { lt: targetDate };
    } else if (filter === 'before_30_days') {
      const targetDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { lt: targetDate };
    } else if (filter === 'last_7_days') {
      const targetDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: targetDate };
    } else if (filter === 'last_24_hours') {
      const targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      where.createdAt = { gte: targetDate };
    } else if (beforeDate || afterDate) {
      where.createdAt = {};
      if (beforeDate) where.createdAt.lt = new Date(String(beforeDate));
      if (afterDate) where.createdAt.gte = new Date(String(afterDate));
    }

    // Find submissions matching filter
    const matchingSubmissions = await prisma.submission.findMany({
      where,
      select: { id: true, report: { select: { id: true } } },
    });

    const matchingIds = matchingSubmissions.map((s) => s.id);
    const count = matchingIds.length;

    if (count > 0) {
      const reportIds = matchingSubmissions
        .map((s) => s.report?.id)
        .filter(Boolean) as string[];

      await prisma.$transaction([
        prisma.delivery.deleteMany({
          where: { reportId: { in: reportIds } },
        }),
        prisma.report.deleteMany({
          where: { id: { in: reportIds } },
        }),
        prisma.providerResult.deleteMany({
          where: { submissionId: { in: matchingIds } },
        }),
        prisma.submission.deleteMany({
          where: { id: { in: matchingIds } },
        }),
      ]);
    }

    // Record audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'CLEAR_SUBMISSION_HISTORY',
          targetType: 'SYSTEM',
          targetId: `Purged ${count} submissions with filter: ${filter || 'ALL'}`,
          ip: req.ip || '127.0.0.1',
        },
      });
    }

    res.json({
      message: `Successfully cleared ${count} submission records matching filter.`,
      purgedCount: count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Log Viewer
router.get('/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
