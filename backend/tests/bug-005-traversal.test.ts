import path from 'path';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MAX_FILE_SIZE,
  generateSecureFilename,
  isPathWithinUploadDir,
  sanitizeFilename,
  validateExtension,
  validateFileUpload,
  validateMimeType,
} from '../src/utils/safe-file-upload';

describe('Bug-005 directory traversal protection', () => {
  describe('generateSecureFilename', () => {
    it('generates unique filenames without leaking the original name', () => {
      const filename1 = generateSecureFilename('test.jpg');
      const filename2 = generateSecureFilename('test.jpg');

      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/^\d+-[a-f0-9]{64}\.jpg$/);
      expect(filename1).not.toContain('test');
    });

    const extensionCases: Array<[string, string]> = [
      ['photo.png', '.png'],
      ['doc.pdf', '.pdf'],
      ['image.JPG', '.jpg'],
      ['file.DOCX', '.docx'],
    ];

    extensionCases.forEach(([input, expectedExt]) => {
      it(`preserves ${expectedExt} for ${input}`, () => {
        expect(generateSecureFilename(input).endsWith(expectedExt)).toBe(true);
      });
    });
  });

  describe('validateExtension', () => {
    const validFiles = [
      'file.jpg',
      'file.jpeg',
      'file.png',
      'file.gif',
      'file.webp',
      'file.pdf',
      'file.doc',
      'file.docx',
    ];

    validFiles.forEach((filename) => {
      it(`accepts ${filename}`, () => {
        expect(validateExtension(filename)).toBe(true);
      });
    });

    const invalidFiles = [
      'file.exe',
      'file.php',
      'file.js',
      'file.sh',
      'file.bat',
      'file.py',
    ];

    invalidFiles.forEach((filename) => {
      it(`rejects ${filename}`, () => {
        expect(validateExtension(filename)).toBe(false);
      });
    });
  });

  describe('validateMimeType', () => {
    const validMimeCombos: Array<[string, string]> = [
      ['image.jpg', 'image/jpeg'],
      ['image.jpeg', 'image/jpeg'],
      ['image.png', 'image/png'],
      ['doc.pdf', 'application/pdf'],
    ];

    validMimeCombos.forEach(([filename, mime]) => {
      it(`accepts ${mime} for ${path.extname(filename)}`, () => {
        expect(validateMimeType(filename, mime)).toBe(true);
      });
    });

    const invalidMimeCombos: Array<[string, string]> = [
      ['image.jpg', 'image/png'],
      ['file.exe', 'application/x-msdownload'],
      ['shell.php', 'text/x-php'],
    ];

    invalidMimeCombos.forEach(([filename, mime]) => {
      it(`rejects ${mime} for ${filename}`, () => {
        expect(validateMimeType(filename, mime)).toBe(false);
      });
    });
  });

  describe('isPathWithinUploadDir', () => {
    const uploadDir = '/app/uploads';

    const safePaths = [
      '/app/uploads/file.jpg',
      '/app/uploads/subdir/file.png',
      '/app/uploads/2024/01/file.pdf',
    ];

    safePaths.forEach((targetPath) => {
      it(`allows ${path.basename(targetPath)}`, () => {
        expect(isPathWithinUploadDir(targetPath, uploadDir)).toBe(true);
      });
    });

    const traversalPaths = [
      '/app/uploads/../etc/passwd',
      '/app/uploads/../../etc/passwd',
      '/app/uploads/../../../etc/shadow',
      '/etc/passwd',
      '/app/uploads/subdir/../../../../etc/passwd',
    ];

    traversalPaths.forEach((targetPath) => {
      it(`blocks traversal path ${targetPath}`, () => {
        expect(isPathWithinUploadDir(targetPath, uploadDir)).toBe(false);
      });
    });

    const windowsPaths = [
      'C:\\Windows\\System32\\config.jpg',
      '\\\\server\\share\\file.jpg',
      'C:/Windows/System32/config.jpg',
    ];

    windowsPaths.forEach((targetPath) => {
      it(`blocks windows path ${targetPath}`, () => {
        expect(isPathWithinUploadDir(targetPath, uploadDir)).toBe(false);
      });
    });
  });

  describe('sanitizeFilename', () => {
    const traversalFilenames = [
      '../../../etc/passwd.jpg',
      '..\\..\\windows\\system32\\config.jpg',
      '/absolute/path/file.jpg',
    ];

    traversalFilenames.forEach((input) => {
      it(`removes traversal markers from ${input}`, () => {
        const sanitized = sanitizeFilename(input);
        expect(sanitized).not.toContain('..');
        expect(sanitized.startsWith('/')).toBe(false);
      });
    });

    it('removes null bytes', () => {
      expect(sanitizeFilename('test\x00.php.jpg')).not.toContain('\x00');
    });

    it('sanitizes special characters', () => {
      expect(sanitizeFilename('file<script>alert(1)</script>.jpg')).toBe(
        'file_script_alert_1___script_.jpg'
      );
    });

    it('changes unicode and bidi control sequences', () => {
      const disguisedFilename = '\u0444\u0430\u0439\u043b\u202ejpg.exe';

      expect(sanitizeFilename(disguisedFilename)).not.toBe(disguisedFilename);
    });
  });

  describe('validateFileUpload', () => {
    it('accepts a valid upload', () => {
      const result = validateFileUpload('photo.jpg', 'image/jpeg', 1024);

      expect(result.valid).toBe(true);
      expect(result.secureFilename).toMatch(/^\d+-[a-f0-9]{64}\.jpg$/);
    });

    it('rejects oversized uploads', () => {
      const result = validateFileUpload(
        'large.jpg',
        'image/jpeg',
        DEFAULT_MAX_FILE_SIZE + 1
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('rejects invalid extensions', () => {
      const result = validateFileUpload('shell.php', 'text/x-php', 1024);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('extension');
    });

    it('rejects MIME mismatches', () => {
      const result = validateFileUpload('fake.jpg', 'application/pdf', 1024);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('MIME');
    });

    it('handles double extensions by validating the final extension', () => {
      const result = validateFileUpload('shell.php.jpg', 'image/jpeg', 1024);

      expect(result.valid).toBe(true);
      expect(result.secureFilename?.endsWith('.jpg')).toBe(true);
    });
  });

  describe('filename unpredictability', () => {
    it('generates unique filenames across repeated uploads', () => {
      const filenames = Array.from({ length: 10 }, () =>
        generateSecureFilename('test.jpg')
      );

      expect(new Set(filenames).size).toBe(10);
    });

    it('uses a 64-character hex random component and numeric timestamp', () => {
      const sample = generateSecureFilename('test.jpg');
      const [timestamp, remainder] = sample.split('-', 2);
      const hexPart = remainder.split('.')[0];

      expect(timestamp).toMatch(/^\d{13,}$/);
      expect(hexPart).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
