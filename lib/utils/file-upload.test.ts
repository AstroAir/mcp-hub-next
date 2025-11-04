import {
  validateFile,
  fileToBase64,
  fileToAttachment,
  formatFileSize,
  getFileIcon,
  isImageFile,
  validateFiles,
  getFileExtension,
  getFileNameWithoutExtension,
  DEFAULT_FILE_UPLOAD_CONFIG,
} from './file-upload';
import { createMockFile } from '../__tests__/test-utils';

// Ensure FileReader exists in JSDOM

describe('file-upload utils', () => {
  it('validates file size and type', () => {
    const file = createMockFile('a.txt', 'hello', 'text/plain');
    expect(validateFile(file).valid).toBe(true);

    const big = new File([new Blob([new Uint8Array(DEFAULT_FILE_UPLOAD_CONFIG.maxFileSize + 1)])], 'b.bin', { type: 'application/octet-stream' });
    const res = validateFile(big, { ...DEFAULT_FILE_UPLOAD_CONFIG, allowedTypes: ['application/octet-stream'], maxFileSize: 10 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/exceeds/);

    const badType = createMockFile('c.xyz', 'x', 'application/x-custom');
    const res2 = validateFile(badType);
    expect(res2.valid).toBe(false);
  });

  it('converts file to base64 and attachment', async () => {
    const file = createMockFile('a.txt', 'hello', 'text/plain');
    const b64 = await fileToBase64(file);
    expect(b64.startsWith('data:text/plain;base64,')).toBe(true);

    const att = await fileToAttachment(file);
    expect(att.id).toBeTruthy();
    expect(att.name).toBe('a.txt');
    expect(att.data).toBeTruthy();
  });

  it('formats sizes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('returns icons and type helpers', () => {
    expect(getFileIcon('image/png')).toBe('Image');
    expect(getFileIcon('application/pdf')).toBe('FileText');
    expect(isImageFile('image/jpeg')).toBe(true);
  });

  it('validates multiple files and aggregates errors', () => {
    const files = [
      createMockFile('a.txt', 'x', 'text/plain'),
      createMockFile('b.xyz', 'x', 'application/x-custom'),
    ];
    const res = validateFiles(files);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('gets file extensions and base name', () => {
    expect(getFileExtension('a.TXT')).toBe('txt');
    expect(getFileNameWithoutExtension('a.b.c.txt')).toBe('a.b.c');
  });
});
