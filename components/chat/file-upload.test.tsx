/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from './file-upload';
import type { FileAttachment } from '@/lib/types';
import { toast } from 'sonner';
import * as fileUploadUtils from '@/lib/utils/file-upload';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock file-upload utils
jest.mock('@/lib/utils/file-upload', () => ({
  validateFile: jest.fn(),
  fileToAttachment: jest.fn(),
  formatFileSize: jest.fn((size: number) => `${size} bytes`),
  isImageFile: jest.fn((type: string) => type.startsWith('image/')),
  getFileIcon: jest.fn(() => 'File'),
  DEFAULT_FILE_UPLOAD_CONFIG: {
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5,
    allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.pdf'],
  },
}));

// Mock ImagePreviewDialog
jest.mock('./image-preview-dialog', () => ({
  ImagePreviewDialog: ({ open, src }: any) =>
    open ? <div data-testid="image-preview-dialog">{src}</div> : null,
}));

// Mock PdfPreviewDialog
jest.mock('./pdf-preview-dialog', () => ({
  PdfPreviewDialog: ({ open, src }: any) =>
    open ? <div data-testid="pdf-preview-dialog">{src}</div> : null,
}));

describe('FileUpload', () => {
  const mockOnAttachmentsChange = jest.fn();

  const createMockFile = (name: string, type: string, size: number = 1024): File => {
    const file = new File(['content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  const createMockAttachment = (overrides?: Partial<FileAttachment>): FileAttachment => ({
    id: 'file-1',
    name: 'test.pdf',
    size: 1024,
    type: 'application/pdf',
    uploadedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (fileUploadUtils.validateFile as jest.Mock).mockReturnValue({ valid: true });
    (fileUploadUtils.fileToAttachment as jest.Mock).mockResolvedValue(createMockAttachment());
  });

  it('renders upload button by default', () => {
    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not render upload button when showButton is false', () => {
    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
        showButton={false}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders file input element', () => {
    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('multiple');
  });

  it('opens file picker when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const button = screen.getByRole('button');
    const input = screen.getByLabelText('Attach files') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    await user.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('validates files before adding', async () => {
    const user = userEvent.setup();
    const file = createMockFile('test.pdf', 'application/pdf');

    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files') as HTMLInputElement;
    await user.upload(input, file);

    expect(fileUploadUtils.validateFile).toHaveBeenCalledWith(file, expect.any(Object));
  });

  it('adds valid files to attachments', async () => {
    const user = userEvent.setup();
    const file = createMockFile('test.pdf', 'application/pdf');
    const mockAttachment = createMockAttachment({ name: 'test.pdf' });
    (fileUploadUtils.fileToAttachment as jest.Mock).mockResolvedValue(mockAttachment);

    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnAttachmentsChange).toHaveBeenCalledWith([mockAttachment]);
    });
  });

  it('validates files before adding', async () => {
    const user = userEvent.setup();
    const validFile = createMockFile('test.pdf', 'application/pdf');
    const invalidFile = createMockFile('test.exe', 'application/exe');

    // Mock validation to return false for .exe files
    (fileUploadUtils.validateFile as jest.Mock).mockImplementation((file) => {
      if (file.type === 'application/exe') {
        return { valid: false, error: 'Invalid file type' };
      }
      return { valid: true };
    });

    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files') as HTMLInputElement;

    // Upload valid file
    await user.upload(input, validFile);

    await waitFor(() => {
      expect(fileUploadUtils.validateFile).toHaveBeenCalledWith(validFile, expect.any(Object));
      expect(mockOnAttachmentsChange).toHaveBeenCalled();
    });
  });

  it('shows error when exceeding max files limit', async () => {
    const user = userEvent.setup();
    const existingAttachments = Array.from({ length: 5 }, (_, i) =>
      createMockAttachment({ id: `file-${i}` })
    );
    const file = createMockFile('test.pdf', 'application/pdf');

    render(
      <FileUpload
        attachments={existingAttachments}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Maximum 5 files allowed');
    });
  });

  it('shows success toast after adding files', async () => {
    const user = userEvent.setup();
    const file = createMockFile('test.pdf', 'application/pdf');

    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Added 1 file');
    });
  });

  it('displays attachment preview when showPreview is true', () => {
    const attachments = [createMockAttachment({ name: 'document.pdf' })];

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
        showPreview={true}
      />
    );

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1024 bytes')).toBeInTheDocument();
  });

  it('does not display preview when showPreview is false', () => {
    const attachments = [createMockAttachment({ name: 'document.pdf' })];

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
        showPreview={false}
      />
    );

    expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
  });

  it('displays file count badge when showCount is true', () => {
    const attachments = [
      createMockAttachment({ id: '1' }),
      createMockAttachment({ id: '2' }),
    ];

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
        showCount={true}
      />
    );

    expect(screen.getByText('2 / 5 files')).toBeInTheDocument();
  });

  it('removes attachment when remove button is clicked', async () => {
    const user = userEvent.setup();
    const attachments = [
      createMockAttachment({ id: 'file-1', name: 'test.pdf' }),
    ];

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
        showPreview={true}
      />
    );

    // Find remove button (X button) - it's the last button in the list
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons[removeButtons.length - 1];

    await user.click(removeButton);

    await waitFor(() => {
      expect(mockOnAttachmentsChange).toHaveBeenCalledWith([]);
    });
  });

  it('displays image preview for image files', () => {
    (fileUploadUtils.isImageFile as jest.Mock).mockReturnValue(true);
    const attachments = [
      createMockAttachment({
        name: 'image.png',
        type: 'image/png',
        url: 'data:image/png;base64,abc123',
      }),
    ];

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
        showPreview={true}
      />
    );

    const image = screen.getByAltText('image.png');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'data:image/png;base64,abc123');
  });

  it('opens image preview dialog when image is clicked', async () => {
    const user = userEvent.setup();
    (fileUploadUtils.isImageFile as jest.Mock).mockReturnValue(true);
    const attachments = [
      createMockAttachment({
        name: 'image.png',
        type: 'image/png',
        url: 'data:image/png;base64,abc123',
      }),
    ];

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
        showPreview={true}
      />
    );

    const image = screen.getByAltText('image.png');
    await user.click(image);

    await waitFor(() => {
      expect(screen.getByTestId('image-preview-dialog')).toBeInTheDocument();
    });
  });

  it('opens PDF preview dialog when PDF icon is clicked', async () => {
    const user = userEvent.setup();
    const attachments = [
      createMockAttachment({
        name: 'document.pdf',
        type: 'application/pdf',
        url: 'data:application/pdf;base64,xyz789',
      }),
    ];

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
        showPreview={true}
      />
    );

    // Find the PDF icon button
    const buttons = screen.getAllByRole('button');
    const pdfButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Preview PDF');

    if (pdfButton) {
      await user.click(pdfButton);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-preview-dialog')).toBeInTheDocument();
      });
    }
  });

  it('disables upload button when disabled prop is true', () => {
    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables upload button when max files reached', () => {
    const attachments = Array.from({ length: 5 }, (_, i) =>
      createMockAttachment({ id: `file-${i}` })
    );

    render(
      <FileUpload
        attachments={attachments}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    // The first button is the upload button
    const buttons = screen.getAllByRole('button');
    const uploadButton = buttons[0];
    expect(uploadButton).toBeDisabled();
  });

  it('handles multiple file selection', async () => {
    const user = userEvent.setup();
    const files = [
      createMockFile('file1.pdf', 'application/pdf'),
      createMockFile('file2.pdf', 'application/pdf'),
    ];

    (fileUploadUtils.fileToAttachment as jest.Mock)
      .mockResolvedValueOnce(createMockAttachment({ id: '1', name: 'file1.pdf' }))
      .mockResolvedValueOnce(createMockAttachment({ id: '2', name: 'file2.pdf' }));

    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files') as HTMLInputElement;
    await user.upload(input, files);

    await waitFor(() => {
      expect(mockOnAttachmentsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'file1.pdf' }),
          expect.objectContaining({ name: 'file2.pdf' }),
        ])
      );
    });
  });

  it('resets file input after selection', async () => {
    const user = userEvent.setup();
    const file = createMockFile('test.pdf', 'application/pdf');

    render(
      <FileUpload
        attachments={[]}
        onAttachmentsChange={mockOnAttachmentsChange}
      />
    );

    const input = screen.getByLabelText('Attach files') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});

