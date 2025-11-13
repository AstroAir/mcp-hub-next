/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptOptimizationToggle } from './prompt-optimization-toggle';
import { useChatStore } from '@/lib/stores';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      label: 'Optimize prompts',
    };
    return translations[key] || key;
  },
}));

// Mock stores
jest.mock('@/lib/stores', () => ({
  useChatStore: jest.fn(),
}));

describe('PromptOptimizationToggle', () => {
  const mockSetOptimizePrompts = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useChatStore as jest.Mock).mockReturnValue({
      optimizePrompts: false,
      setOptimizePrompts: mockSetOptimizePrompts,
    });
  });

  it('renders the toggle switch', () => {
    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<PromptOptimizationToggle />);
    
    expect(screen.getByText('Optimize prompts')).toBeInTheDocument();
  });

  it('renders the sparkles icon', () => {
    const { container } = render(<PromptOptimizationToggle />);
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('shows unchecked state when optimizePrompts is false', () => {
    (useChatStore as jest.Mock).mockReturnValue({
      optimizePrompts: false,
      setOptimizePrompts: mockSetOptimizePrompts,
    });

    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('shows checked state when optimizePrompts is true', () => {
    (useChatStore as jest.Mock).mockReturnValue({
      optimizePrompts: true,
      setOptimizePrompts: mockSetOptimizePrompts,
    });

    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls setOptimizePrompts when toggle is clicked', async () => {
    const user = userEvent.setup();
    
    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    
    expect(mockSetOptimizePrompts).toHaveBeenCalledWith(true);
  });

  it('toggles from true to false', async () => {
    const user = userEvent.setup();
    
    (useChatStore as jest.Mock).mockReturnValue({
      optimizePrompts: true,
      setOptimizePrompts: mockSetOptimizePrompts,
    });

    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    
    expect(mockSetOptimizePrompts).toHaveBeenCalledWith(false);
  });

  it('label is clickable and toggles the switch', async () => {
    const user = userEvent.setup();
    
    render(<PromptOptimizationToggle />);
    
    const label = screen.getByText('Optimize prompts');
    await user.click(label);
    
    expect(mockSetOptimizePrompts).toHaveBeenCalledWith(true);
  });

  it('has correct id association between switch and label', () => {
    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    const label = screen.getByText('Optimize prompts').closest('label');
    
    expect(toggle).toHaveAttribute('id', 'optimizePrompts');
    expect(label).toHaveAttribute('for', 'optimizePrompts');
  });

  it('label has cursor-pointer class', () => {
    render(<PromptOptimizationToggle />);
    
    const label = screen.getByText('Optimize prompts').closest('label');
    expect(label).toHaveClass('cursor-pointer');
  });

  it('icon has primary color class', () => {
    const { container } = render(<PromptOptimizationToggle />);
    
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('text-primary');
  });

  it('renders with responsive text size', () => {
    render(<PromptOptimizationToggle />);
    
    const label = screen.getByText('Optimize prompts').closest('label');
    expect(label).toHaveClass('text-xs', 'md:text-sm');
  });

  it('icon has responsive size classes', () => {
    const { container } = render(<PromptOptimizationToggle />);
    
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('h-3.5', 'w-3.5', 'md:h-4', 'md:w-4');
  });

  it('maintains state across re-renders', () => {
    const { rerender } = render(<PromptOptimizationToggle />);
    
    (useChatStore as jest.Mock).mockReturnValue({
      optimizePrompts: true,
      setOptimizePrompts: mockSetOptimizePrompts,
    });

    rerender(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('handles rapid toggling', async () => {
    const user = userEvent.setup();
    
    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    
    await user.click(toggle);
    await user.click(toggle);
    await user.click(toggle);
    
    expect(mockSetOptimizePrompts).toHaveBeenCalledTimes(3);
  });

  it('renders within a flex container', () => {
    const { container } = render(<PromptOptimizationToggle />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('label contains both icon and text', () => {
    const { container } = render(<PromptOptimizationToggle />);
    
    const label = screen.getByText('Optimize prompts').closest('label');
    const icon = label?.querySelector('svg');
    
    expect(icon).toBeInTheDocument();
    expect(label).toHaveTextContent('Optimize prompts');
  });

  it('is accessible via keyboard', async () => {
    const user = userEvent.setup();
    
    render(<PromptOptimizationToggle />);
    
    const toggle = screen.getByRole('switch');
    toggle.focus();
    
    expect(toggle).toHaveFocus();
    
    await user.keyboard(' '); // Space key
    
    expect(mockSetOptimizePrompts).toHaveBeenCalled();
  });

  it('updates when store state changes', () => {
    const { rerender } = render(<PromptOptimizationToggle />);
    
    let toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    // Update store state
    (useChatStore as jest.Mock).mockReturnValue({
      optimizePrompts: true,
      setOptimizePrompts: mockSetOptimizePrompts,
    });
    
    rerender(<PromptOptimizationToggle />);
    
    toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});

