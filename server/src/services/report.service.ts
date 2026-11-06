import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export interface PDFReportData {
  submissionId: string;
  createdAt: string;
  wordCount: number;
  userName: string;
  combinedScore: number;
  verdict: string;
  agreement: string;
  detectorResults: Array<{
    provider: string;
    aiScore: number;
    label: string;
    status: string;
  }>;
  originalText: string;
}

export class ReportService {
  static async generatePDF(data: PDFReportData): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Color definitions (TMQ Theme)
    const forestGreen = rgb(14 / 255, 59 / 255, 44 / 255);
    const parchment = rgb(246 / 255, 241 / 255, 227 / 255);
    const ink = rgb(27 / 255, 27 / 255, 24 / 255);
    const moss = rgb(63 / 255, 125 / 255, 88 / 255);
    const amber = rgb(183 / 255, 121 / 255, 31 / 255);

    // Parchment background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: parchment,
    });

    // Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width,
      height: 80,
      color: forestGreen,
    });

    page.drawText('THE MIDNIGHT QUILL', {
      x: 40,
      y: height - 42,
      size: 18,
      font: fontBold,
      color: parchment,
    });

    page.drawText('Authenticity Desk -- Multi-Detector Forensic Report', {
      x: 40,
      y: height - 62,
      size: 10,
      font: fontRegular,
      color: parchment,
    });

    let currentY = height - 110;

    // Submission Metadata
    page.drawText(`Submission ID: ${data.submissionId}`, { x: 40, y: currentY, size: 9, font: fontRegular, color: ink });
    currentY -= 15;
    page.drawText(`Author / Editor: ${data.userName}   |   Word Count: ${data.wordCount} words   |   Date: ${new Date(data.createdAt).toLocaleString()}`, {
      x: 40,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: moss,
    });

    currentY -= 35;

    // Verdict Box / Seal
    const verdictColor = data.verdict === 'LIKELY_HUMAN' ? moss : (data.verdict === 'MIXED' ? amber : forestGreen);
    page.drawRectangle({
      x: 40,
      y: currentY - 50,
      width: width - 80,
      height: 60,
      borderColor: verdictColor,
      borderWidth: 2,
      color: parchment,
    });

    const verdictText = data.verdict === 'LIKELY_HUMAN' ? 'VERDICT: LIKELY HUMAN AUTHORED' : (data.verdict === 'MIXED' ? 'VERDICT: MIXED / UNCERTAIN' : 'VERDICT: LIKELY AI GENERATED');
    page.drawText(verdictText, {
      x: 60,
      y: currentY - 22,
      size: 14,
      font: fontBold,
      color: verdictColor,
    });

    page.drawText(`Combined AI Score: ${data.combinedScore}%   |   Detector Agreement: ${data.agreement}`, {
      x: 60,
      y: currentY - 40,
      size: 10,
      font: fontRegular,
      color: ink,
    });

    currentY -= 80;

    // Detector Results Table Header
    page.drawText('DETECTOR BREAKDOWN', { x: 40, y: currentY, size: 12, font: fontBold, color: forestGreen });
    currentY -= 18;

    // Draw detector rows
    data.detectorResults.forEach((res) => {
      page.drawRectangle({
        x: 40,
        y: currentY - 18,
        width: width - 80,
        height: 22,
        color: rgb(238 / 255, 233 / 255, 219 / 255),
      });

      page.drawText(res.provider, { x: 50, y: currentY - 12, size: 9, font: fontBold, color: ink });
      page.drawText(`AI Score: ${res.aiScore}%`, { x: 200, y: currentY - 12, size: 9, font: fontRegular, color: ink });
      page.drawText(`Label: ${res.label}`, { x: 330, y: currentY - 12, size: 9, font: fontRegular, color: moss });
      page.drawText(`Status: ${res.status}`, { x: 460, y: currentY - 12, size: 9, font: fontRegular, color: ink });
      currentY -= 26;
    });

    currentY -= 15;

    // Disclaimer
    page.drawText('DISCLAIMER: AI content detection scores are probabilistic estimations based on linguistic metrics and should not be used as sole punitive evidence.', {
      x: 40,
      y: currentY,
      size: 7.5,
      font: fontOblique,
      color: ink,
    });

    currentY -= 30;

    // Original Text Section
    page.drawText('APPENDIX: ORIGINAL TEXT SUBMISSION', { x: 40, y: currentY, size: 11, font: fontBold, color: forestGreen });
    currentY -= 18;

    const snippet = data.originalText.slice(0, 1500) + (data.originalText.length > 1500 ? '... [Truncated in summary PDF, full text recorded in database]' : '');
    const lines = snippet.match(/.{1,90}(\s|$)/g) || [snippet];

    for (const line of lines) {
      if (currentY < 40) {
        page = pdfDoc.addPage([595.28, 841.89]);
        page.drawRectangle({ x: 0, y: 0, width, height, color: parchment });
        currentY = height - 50;
      }
      page.drawText(line.trim(), {
        x: 40,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: ink,
      });
      currentY -= 12;
    }

    const pdfBytes = await pdfDoc.save();

    // Ensure storage dir exists
    const storageDir = path.join(process.cwd(), 'uploads', 'reports');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const fileName = `report_${data.submissionId}.pdf`;
    const filePath = path.join(storageDir, fileName);
    fs.writeFileSync(filePath, pdfBytes);

    return `/uploads/reports/${fileName}`;
  }
}
