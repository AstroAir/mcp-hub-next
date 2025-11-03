/**
 * File Attachment Types
 * Types for file uploads and attachments in chat messages
 */

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string; // Data URL or blob URL for preview
  data?: string; // Base64 encoded data for storage
  uploadedAt: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileUploadConfig {
  maxFileSize: number; // in bytes
  maxFiles: number;
  allowedTypes: string[]; // MIME types
  allowedExtensions: string[]; // file extensions
}

export const DEFAULT_FILE_UPLOAD_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    // Code
    'text/x-python',
    'text/x-java',
    'text/x-c',
    'text/x-c++',
    'text/x-typescript',
    // Archives
    'application/zip',
    'application/x-tar',
    'application/gzip',
  ],
  allowedExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.html', '.css', '.js', '.json', '.xml',
    '.py', '.java', '.c', '.cpp', '.ts', '.tsx', '.jsx',
    '.zip', '.tar', '.gz',
  ],
};

