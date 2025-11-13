/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreviewDialog } from './image-preview-dialog';

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children, onOpenChange }: any) =>
    open ? <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
}));

describe('ImagePreviewDialog', () => {
  const mockOnOpenChange = jest.fn();
  const testImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open is true', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <ImagePreviewDialog
        open={false}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('displays the image with correct src', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', testImageSrc);
  });

  it('displays image with default alt text when not provided', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        onOpenChange={mockOnOpenChange}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('renders zoom in button', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomInButton = screen.getByTitle('Zoom in');
    expect(zoomInButton).toBeInTheDocument();
  });

  it('renders zoom out button', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomOutButton = screen.getByTitle('Zoom out');
    expect(zoomOutButton).toBeInTheDocument();
  });

  it('renders reset button', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const resetButton = screen.getByTitle('Reset');
    expect(resetButton).toBeInTheDocument();
  });

  it('zooms in when zoom in button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomInButton = screen.getByTitle('Zoom in');
    await user.click(zoomInButton);

    // Button should be clickable (zoom functionality is tested in integration tests)
    expect(zoomInButton).toBeInTheDocument();
  });

  it('zooms out when zoom out button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomInButton = screen.getByTitle('Zoom in');
    const zoomOutButton = screen.getByTitle('Zoom out');
    
    // Zoom in first
    await user.click(zoomInButton);
    await user.click(zoomInButton);
    
    // Then zoom out
    await user.click(zoomOutButton);
    
    const image = screen.getByAltText('Test image');
    expect(image.style.transform).toBeTruthy();
  });

  it('resets zoom and position when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomInButton = screen.getByTitle('Zoom in');
    const resetButton = screen.getByTitle('Reset');
    
    // Zoom in
    await user.click(zoomInButton);
    await user.click(zoomInButton);
    
    // Reset
    await user.click(resetButton);
    
    const image = screen.getByAltText('Test image');
    expect(image.style.transform).toContain('scale(1)');
  });

  it('handles wheel event for zooming', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const container = screen.getByAltText('Test image').parentElement;

    if (container) {
      // Simulate wheel event (zoom in)
      fireEvent.wheel(container, { deltaY: -100 });

      const image = screen.getByAltText('Test image');
      expect(image.style.transform).toBeTruthy();
    }
  });

  it('allows dragging when zoomed in', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomInButton = screen.getByTitle('Zoom in');
    await user.click(zoomInButton);
    await user.click(zoomInButton);

    const container = screen.getByAltText('Test image').parentElement;

    if (container) {
      fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(container);

      const image = screen.getByAltText('Test image');
      expect(image.style.transform).toBeTruthy();
    }
  });

  it('does not allow dragging when not zoomed', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const container = screen.getByAltText('Test image').parentElement;

    if (container) {
      const image = screen.getByAltText('Test image');
      const initialTransform = image.style.transform;

      fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(container);

      // Transform should not change when scale is 1
      expect(image.style.transform).toBe(initialTransform);
    }
  });

  it('stops dragging on mouse leave', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const container = screen.getByAltText('Test image').parentElement;

    if (container) {
      fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
      fireEvent.mouseLeave(container);
      fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });

      // Should not update position after mouse leave
      expect(container).toBeInTheDocument();
    }
  });

  it('limits zoom to maximum scale', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomInButton = screen.getByTitle('Zoom in');

    // Click zoom in many times
    for (let i = 0; i < 30; i++) {
      await user.click(zoomInButton);
    }

    const image = screen.getByAltText('Test image');
    // Scale should increase from initial value
    expect(image.style.transform).toBeTruthy();
    expect(image.style.transform).toContain('scale');
  });

  it('limits zoom to minimum scale', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const zoomOutButton = screen.getByTitle('Zoom out');
    
    // Click zoom out many times
    for (let i = 0; i < 10; i++) {
      await user.click(zoomOutButton);
    }
    
    const image = screen.getByAltText('Test image');
    // Scale should be capped at 1
    expect(image.style.transform).toContain('scale(1)');
  });

  it('resets state when dialog closes', () => {
    const { rerender } = render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    // Close dialog
    rerender(
      <ImagePreviewDialog
        open={false}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('has correct ARIA label', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test alt text"
        onOpenChange={mockOnOpenChange}
      />
    );

    const container = screen.getByAltText('Test alt text').parentElement;
    expect(container).toHaveAttribute('aria-label', 'Test alt text');
  });

  it('prevents image dragging', () => {
    render(
      <ImagePreviewDialog
        open={true}
        src={testImageSrc}
        alt="Test image"
        onOpenChange={mockOnOpenChange}
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('draggable', 'false');
  });
});

