import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Count words in text.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Compute SHA-256 hash of text.
 */
export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Extract text from an uploaded file based on its extension.
 * Supports .txt, .docx (basic), .pdf (basic text extraction).
 */
export async function extractTextFromFile(
  filePath: string,
  mimeType: string
): Promise<{ text: string; sourceType: string }> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.txt': {
      const text = fs.readFileSync(filePath, 'utf-8');
      return { text, sourceType: 'TXT' };
    }

    case '.docx': {
      const text = await extractDocxText(filePath);
      return { text, sourceType: 'DOCX' };
    }

    case '.pdf': {
      const text = await extractPdfText(filePath);
      return { text, sourceType: 'PDF' };
    }

    default:
      throw new Error(`Unsupported file type: ${ext}. Supported: .txt, .docx, .pdf`);
  }
}

/**
 * Basic DOCX text extraction.
 * DOCX files are ZIP archives containing XML. We extract the main document body text.
 */
async function extractDocxText(filePath: string): Promise<string> {
  // DOCX is a ZIP file. We use a minimal approach without heavy dependencies.
  // Read the file as a buffer and find the document.xml content.
  const AdmZip = await loadAdmZipOrFallback();

  if (AdmZip) {
    try {
      const zip = new AdmZip(filePath);
      const docXml = zip.readAsText('word/document.xml');
      // Strip XML tags to get plain text
      return stripXmlTags(docXml);
    } catch {
      throw new Error('Failed to parse DOCX file. Please upload a valid .docx file.');
    }
  }

  // Fallback: very basic XML extraction using built-in zlib
  return extractDocxFallback(filePath);
}

/**
 * Try to load adm-zip if available, otherwise return null for fallback.
 */
async function loadAdmZipOrFallback(): Promise<any> {
  try {
    return require('adm-zip');
  } catch {
    return null;
  }
}

/**
 * Fallback DOCX extraction using Node's built-in zlib.
 * Reads the zip file manually to find and extract word/document.xml.
 */
async function extractDocxFallback(filePath: string): Promise<string> {
  const { execSync } = require('child_process');

  // Try using PowerShell to extract (Windows) or unzip (Unix)
  try {
    const tempDir = path.join(path.dirname(filePath), '_docx_temp_' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      execSync(
        `powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${tempDir}' -Force"`,
        { timeout: 10000 }
      );
    } catch {
      execSync(`unzip -o "${filePath}" -d "${tempDir}"`, { timeout: 10000 });
    }

    const docXmlPath = path.join(tempDir, 'word', 'document.xml');
    if (fs.existsSync(docXmlPath)) {
      const xml = fs.readFileSync(docXmlPath, 'utf-8');
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
      return stripXmlTags(xml);
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error('Could not find document.xml in DOCX file.');
  } catch (err: any) {
    throw new Error(`Failed to extract DOCX text: ${err.message}`);
  }
}

/**
 * Basic PDF text extraction.
 * Uses pdf-lib to read text content. Falls back to simple binary text extraction.
 */
async function extractPdfText(filePath: string): Promise<string> {
  // pdf-lib doesn't directly support text extraction from existing PDFs.
  // We'll use a simple regex-based approach on the raw PDF bytes for basic extraction.
  const buffer = fs.readFileSync(filePath);
  const text = extractTextFromPdfBuffer(buffer);

  if (text.trim().length > 0) {
    return text;
  }

  throw new Error(
    'Could not extract text from PDF. The PDF might contain only images. Please paste the text directly.'
  );
}

/**
 * Simple text extraction from PDF binary data.
 * Looks for text between BT/ET blocks and decodes basic PDF text operators.
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const textParts: string[] = [];

  // Extract text from stream objects by looking for text show operators
  // This handles Tj, TJ, ', " operators
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(content)) !== null) {
    const streamContent = match[1];

    // Look for BT...ET blocks (Begin Text / End Text)
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btEtRegex.exec(streamContent)) !== null) {
      const textBlock = btMatch[1];

      // Extract text from Tj operator: (text) Tj
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
        textParts.push(decodePdfString(tjMatch[1]));
      }

      // Extract text from TJ operator: [(text) num (text)] TJ
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let tjArrayMatch: RegExpExecArray | null;
      while ((tjArrayMatch = tjArrayRegex.exec(textBlock)) !== null) {
        const innerRegex = /\(([^)]*)\)/g;
        let innerMatch: RegExpExecArray | null;
        while ((innerMatch = innerRegex.exec(tjArrayMatch[1])) !== null) {
          textParts.push(decodePdfString(innerMatch[1]));
        }
      }
    }
  }

  return textParts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Decode basic PDF string escapes.
 */
function decodePdfString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Strip XML tags and return plain text.
 */
function stripXmlTags(xml: string): string {
  // First extract text content between w:t tags (Word document text)
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const texts: string[] = [];
  let wMatch: RegExpExecArray | null;

  while ((wMatch = wtRegex.exec(xml)) !== null) {
    texts.push(wMatch[1]);
  }

  if (texts.length > 0) {
    // Join with spaces, but collapse paragraph boundaries
    let result = '';
    const paragraphRegex = /<w:p[\s>]/g;
    const paragraphs = xml.split(paragraphRegex);

    for (const para of paragraphs) {
      const paraTexts: string[] = [];
      const innerRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let innerMatch: RegExpExecArray | null;
      while ((innerMatch = innerRegex.exec(para)) !== null) {
        paraTexts.push(innerMatch[1]);
      }
      if (paraTexts.length > 0) {
        result += paraTexts.join('') + '\n';
      }
    }

    return result.trim();
  }

  // Fallback: strip all XML tags
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate text to a maximum word count.
 */
export function truncateText(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}
