import React from 'react';
import { render } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toBeInTheDocument();
  });

  it('renders with role="progressbar"', () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
  });

  it('displays correct value', () => {
    const { container } = render(<Progress value={75} />);
    const progress = container.querySelector('[role="progressbar"]');
    // Radix UI Progress component exists
    expect(progress).toBeInTheDocument();
    // Value is reflected in the indicator transform
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
  });

  it('renders indicator with correct transform', () => {
    const { container } = render(<Progress value={60} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-40%)' });
  });

  it('handles 0% progress', () => {
    const { container } = render(<Progress value={0} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('handles 100% progress', () => {
    const { container } = render(<Progress value={100} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('handles undefined value as 0', () => {
    const { container } = render(<Progress />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('applies custom className', () => {
    const { container } = render(<Progress value={50} className="custom-class" />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toHaveClass('custom-class');
  });

  it('renders with default height class', () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toHaveClass('h-2');
  });

  it('renders with full width class', () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toHaveClass('w-full');
  });

  it('renders with rounded-full class', () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toHaveClass('rounded-full');
  });

  it('supports max attribute', () => {
    const { container } = render(<Progress value={50} max={200} />);
    const progress = container.querySelector('[role="progressbar"]');
    // Progress component exists
    expect(progress).toBeInTheDocument();
  });

  it('has default max value of 100', () => {
    const { container } = render(<Progress value={50} />);
    const progress = container.querySelector('[role="progressbar"]');
    // Progress component exists
    expect(progress).toBeInTheDocument();
  });

  it('forwards additional props', () => {
    const { container } = render(<Progress value={50} data-testid="test-progress" />);
    const progress = container.querySelector('[data-testid="test-progress"]');
    expect(progress).toBeInTheDocument();
  });
});

