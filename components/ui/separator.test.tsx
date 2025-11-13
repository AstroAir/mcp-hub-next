import React from 'react';
import { render } from '@testing-library/react';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeInTheDocument();
  });

  it('renders with horizontal orientation by default', () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders with vertical orientation when specified', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom-class" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveClass('custom-class');
  });

  it('is decorative by default', () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    // Decorative separators should not have role="separator"
    expect(separator).not.toHaveAttribute('role', 'separator');
  });

  it('has role="separator" when not decorative', () => {
    const { container } = render(<Separator decorative={false} />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('applies horizontal styles for horizontal orientation', () => {
    const { container } = render(<Separator orientation="horizontal" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveClass('data-[orientation=horizontal]:h-px');
    expect(separator).toHaveClass('data-[orientation=horizontal]:w-full');
  });

  it('applies vertical styles for vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toHaveClass('data-[orientation=vertical]:h-full');
    expect(separator).toHaveClass('data-[orientation=vertical]:w-px');
  });

  it('forwards additional props', () => {
    const { container } = render(<Separator data-testid="test-separator" />);
    const separator = container.querySelector('[data-testid="test-separator"]');
    expect(separator).toBeInTheDocument();
  });
});

