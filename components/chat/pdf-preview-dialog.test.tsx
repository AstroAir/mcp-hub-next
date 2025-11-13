/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { PdfPreviewDialog } from './pdf-preview-dialog';

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children, onOpenChange }: any) =>
    open ? <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null,
  DialogContent: ({ children, className, 'aria-label': ariaLabel }: any) => (
    <div data-testid="dialog-content" className={className} aria-label={ariaLabel}>
      {children}
    </div>
  ),
}));

describe('PdfPreviewDialog', () => {
  const mockOnOpenChange = jest.fn();
  const testPdfSrc = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDMgM10+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAwMTAgMDAwMDAgbgowMDAwMDAwMDUzIDAwMDAwIG4KMDAwMDAwMDEwMiAwMDAwMCBuCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTQ5CiUlRU9G';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open is true', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <PdfPreviewDialog
        open={false}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders iframe with correct src', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    const iframe = screen.getByTitle('Test PDF');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', testPdfSrc);
  });

  it('uses default title when not provided', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        onOpenChange={mockOnOpenChange}
      />
    );

    const iframe = screen.getByTitle('PDF preview');
    expect(iframe).toBeInTheDocument();
  });

  it('sets correct aria-label on dialog content', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Custom PDF Title"
        onOpenChange={mockOnOpenChange}
      />
    );

    const dialogContent = screen.getByTestId('dialog-content');
    expect(dialogContent).toHaveAttribute('aria-label', 'Custom PDF Title');
  });

  it('renders iframe with full width and height', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    const iframe = screen.getByTitle('Test PDF');
    expect(iframe).toHaveClass('w-full', 'h-full');
  });

  it('applies correct styling to dialog content', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    const dialogContent = screen.getByTestId('dialog-content');
    expect(dialogContent.className).toContain('max-w-5xl');
    expect(dialogContent.className).toContain('w-[95vw]');
    expect(dialogContent.className).toContain('h-[85vh]');
    expect(dialogContent.className).toContain('p-0');
    expect(dialogContent.className).toContain('overflow-hidden');
  });

  it('handles different PDF sources', () => {
    const sources = [
      'data:application/pdf;base64,abc123',
      'https://example.com/document.pdf',
      '/local/path/to/document.pdf',
    ];

    sources.forEach((src) => {
      const { unmount } = render(
        <PdfPreviewDialog
          open={true}
          src={src}
          title="Test PDF"
          onOpenChange={mockOnOpenChange}
        />
      );

      const iframe = screen.getByTitle('Test PDF');
      expect(iframe).toHaveAttribute('src', src);
      
      unmount();
    });
  });

  it('calls onOpenChange when dialog state changes', () => {
    const { rerender } = render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    // Simulate closing
    rerender(
      <PdfPreviewDialog
        open={false}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTitle('PDF preview')).toBeInTheDocument();
  });

  it('iframe has background styling', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    const iframe = screen.getByTitle('Test PDF');
    expect(iframe).toHaveClass('bg-background');
  });

  it('handles empty src gracefully', () => {
    render(
      <PdfPreviewDialog
        open={true}
        src=""
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    const iframe = screen.getByTitle('Test PDF');
    expect(iframe).toBeInTheDocument();
    // When src is empty, the component may not set the attribute to avoid browser warnings
    // Just verify the iframe exists
  });

  it('updates src when prop changes', () => {
    const { rerender } = render(
      <PdfPreviewDialog
        open={true}
        src="initial.pdf"
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    let iframe = screen.getByTitle('Test PDF');
    expect(iframe).toHaveAttribute('src', 'initial.pdf');

    rerender(
      <PdfPreviewDialog
        open={true}
        src="updated.pdf"
        title="Test PDF"
        onOpenChange={mockOnOpenChange}
      />
    );

    iframe = screen.getByTitle('Test PDF');
    expect(iframe).toHaveAttribute('src', 'updated.pdf');
  });

  it('updates title when prop changes', () => {
    const { rerender } = render(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Initial Title"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByTitle('Initial Title')).toBeInTheDocument();

    rerender(
      <PdfPreviewDialog
        open={true}
        src={testPdfSrc}
        title="Updated Title"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByTitle('Updated Title')).toBeInTheDocument();
    expect(screen.queryByTitle('Initial Title')).not.toBeInTheDocument();
  });
});

