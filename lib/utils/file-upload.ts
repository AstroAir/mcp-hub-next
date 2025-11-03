/**
 * File Upload Utilities
 * Helper functions for file validation, processing, and conversion
 */

import { nanoid } from 'nanoid';
import type {
  FileAttachment,
  FileValidationResult,
  FileUploadConfig,
} from '@/lib/types/file-attachment';
import { DEFAULT_FILE_UPLOAD_CONFIG } from '@/lib/types/file-attachment';

// Re-export DEFAULT_FILE_UPLOAD_CONFIG for convenience
export { DEFAULT_FILE_UPLOAD_CONFIG };

/**
 * Validate a file against upload configuration
 */
export function validateFile(
  file: File,
  config: FileUploadConfig = DEFAULT_FILE_UPLOAD_CONFIG
): FileValidationResult {
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatFileSize(config.maxFileSize)}`,
    };
  }

  // Check file type
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const isTypeAllowed = config.allowedTypes.includes(file.type);
  const isExtensionAllowed = config.allowedExtensions.includes(fileExtension);

  if (!isTypeAllowed && !isExtensionAllowed) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert file to FileAttachment object
 */
export async function fileToAttachment(file: File): Promise<FileAttachment> {
  const dataUrl = await fileToBase64(file);
  
  return {
    id: nanoid(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: dataUrl,
    data: dataUrl,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file icon name based on file type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType.startsWith('video/')) return 'Video';
  if (fileType.startsWith('audio/')) return 'Music';
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('word') || fileType.includes('document')) return 'FileText';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Sheet';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation';
  if (fileType.includes('zip') || fileType.includes('tar') || fileType.includes('gzip')) return 'Archive';
  if (fileType.includes('json') || fileType.includes('xml')) return 'Code';
  if (fileType.startsWith('text/')) return 'FileText';
  return 'File';
}

/**
 * Check if file is an image
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/');
}

/**
 * Download file attachment
 */
export function downloadAttachment(attachment: FileAttachment): void {
  if (!attachment.url && !attachment.data) {
    console.error('No data available for download');
    return;
  }

  const link = document.createElement('a');
  link.href = attachment.url || attachment.data || '';
  link.download = attachment.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  config: FileUploadConfig = DEFAULT_FILE_UPLOAD_CONFIG
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check total number of files
  if (files.length > config.maxFiles) {
    errors.push(`Maximum ${config.maxFiles} files allowed`);
    return { valid: false, errors };
  }

  // Validate each file
  files.forEach((file, index) => {
    const result = validateFile(file, config);
    if (!result.valid && result.error) {
      errors.push(`File ${index + 1} (${file.name}): ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

