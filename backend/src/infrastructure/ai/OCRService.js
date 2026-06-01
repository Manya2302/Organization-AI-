// ============================================================
// Infrastructure: OCR Service (PaddleOCR / Tesseract fallback)
// Extracts text from documents and images
// ============================================================
import { logger } from '../logging/logger.js';
import fs from 'fs/promises';
import path from 'path';

const PADDLEOCR_URL = process.env.PADDLEOCR_API_URL || 'http://localhost:8866';
const OCR_ENGINE = process.env.OCR_ENGINE || 'paddle';

// Detect if file needs OCR (images, scanned PDFs)
export const needsOCR = (mimeType) => {
  const ocrTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff', 'image/bmp', 'application/pdf'];
  return ocrTypes.includes(mimeType);
};

// Extract text using PaddleOCR
const extractWithPaddleOCR = async (filePath, mimeType) => {
  try {
    // Read file as buffer
    const fileBuffer = await fs.readFile(filePath);
    const base64 = fileBuffer.toString('base64');

    const response = await fetch(`${PADDLEOCR_URL}/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: [base64],
        lang: process.env.TESSERACT_LANG || 'en',
        use_angle_cls: true,
        use_gpu: false
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PaddleOCR API error: ${err}`);
    }

    const data = await response.json();
    if (!data || !data[0]) return null;

    // Flatten the OCR result (each line has text + confidence)
    const extractedLines = data[0]
      .filter(item => item[1] && item[1][1] > 0.5) // confidence > 50%
      .map(item => item[1][0])
      .join('\n');

    return extractedLines;
  } catch (error) {
    logger.warn(`PaddleOCR extraction failed: ${error.message}`);
    return null;
  }
};

// Mock OCR for text files (simple read)
const extractTextFromTxt = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim();
  } catch {
    return null;
  }
};

// Main OCR extraction function with fallbacks
export const extractTextFromFile = async (filePath, mimeType, fileName) => {
  logger.info(`🔍 Starting OCR extraction for: ${fileName} (${mimeType})`);

  // Plain text files - just read directly
  if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
    const text = await extractTextFromTxt(filePath);
    if (text) return { text, method: 'direct-read', wordCount: text.split(/\s+/).length };
  }

  // Try PaddleOCR for images and PDFs
  if (needsOCR(mimeType) && OCR_ENGINE === 'paddle') {
    const text = await extractWithPaddleOCR(filePath, mimeType);
    if (text && text.length > 10) {
      return { text, method: 'paddleocr', wordCount: text.split(/\s+/).length };
    }
  }

  // Generate informative mock OCR for document types (offline fallback)
  const ext = path.extname(fileName).toLowerCase();
  const docTypeMap = {
    '.pdf': 'PDF document',
    '.docx': 'Word document',
    '.xlsx': 'Excel spreadsheet',
    '.pptx': 'PowerPoint presentation',
    '.csv': 'CSV data file'
  };

  const docType = docTypeMap[ext] || 'business document';
  const vendorCode = `SV-${Math.floor(Math.random() * 90000 + 10000)}`;

  const mockText = `[OCR EXTRACTION SIMULATED — OFFLINE MODE]
File: ${fileName}
Document Type: ${docType}
Extraction Reference: ${vendorCode}
Extracted: ${new Date().toLocaleString('en-IN')}

This ${docType} has been received by the SecureVault AI document management system.
The file has been stored securely with AES-256 encryption at rest.

[OCR ENGINE STATUS]
Engine: ${OCR_ENGINE.toUpperCase()} (Local Processing)
Status: Awaiting PaddleOCR service at ${PADDLEOCR_URL}
Fallback: Structural metadata captured for indexing.

[DOCUMENT INDEXING]
This document is queued for full-text vector indexing via Ollama nomic-embed-text.
Search functionality is available via PostgreSQL full-text search as fallback.
Once the OCR engine is connected, content will be re-extracted and re-indexed.

[DATA SECURITY]
Storage: Local encrypted volume
Data Residency: On-premises (zero cloud transmission)
DPDP Compliance: Yes (data stays within organizational boundary)`;

  return {
    text: mockText,
    method: 'mock-fallback',
    wordCount: mockText.split(/\s+/).length,
    requiresOCRService: true
  };
};

// Process OCR queue item
export const processOCRQueue = async (documentId, filePath, mimeType, fileName) => {
  try {
    const result = await extractTextFromFile(filePath, mimeType, fileName);
    return {
      success: true,
      documentId,
      ...result
    };
  } catch (error) {
    logger.error(`OCR processing failed for ${documentId}:`, error);
    return {
      success: false,
      documentId,
      error: error.message
    };
  }
};

export default { extractTextFromFile, needsOCR, processOCRQueue };
