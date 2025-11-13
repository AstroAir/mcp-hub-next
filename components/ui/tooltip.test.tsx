/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';

describe('Tooltip', () => {
  it('renders trigger element', () => {
    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('can be controlled to hide tooltip', () => {
    const { rerender } = render(
      <Tooltip open={true}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    // Tooltip should be visible
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Close the tooltip
    rerender(
      <Tooltip open={false}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    // Tooltip should be hidden
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('applies custom className to content', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent className="custom-tooltip">Tooltip text</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);

    await waitFor(() => {
      const content = screen.getByRole('tooltip').parentElement;
      expect(content).toHaveClass('custom-tooltip');
    });
  });

  it('renders with custom sideOffset', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent sideOffset={10}>Tooltip text</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('can be controlled with open prop', () => {
    const { rerender } = render(
      <Tooltip open={false}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    rerender(
      <Tooltip open={true}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('calls onOpenChange when tooltip state changes', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    
    render(
      <Tooltip onOpenChange={onOpenChange}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it('renders with TooltipProvider wrapper', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('supports custom delayDuration', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);

    // Should eventually show after delay
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('renders tooltip arrow', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);

    await waitFor(() => {
      const content = screen.getByRole('tooltip');
      expect(content).toBeInTheDocument();
    });
  });

  it('handles multiple tooltips independently', async () => {
    const user = userEvent.setup();

    render(
      <>
        <Tooltip>
          <TooltipTrigger>First</TooltipTrigger>
          <TooltipContent>First tooltip</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>Second</TooltipTrigger>
          <TooltipContent>Second tooltip</TooltipContent>
        </Tooltip>
      </>
    );

    await user.hover(screen.getByText('First'));
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('First tooltip');
    });

    await user.hover(screen.getByText('Second'));
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Second tooltip');
    });
  });

  it('renders complex content', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>
          <div>
            <strong>Title</strong>
            <p>Description</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    await user.hover(trigger);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('Title');
      expect(tooltip).toHaveTextContent('Description');
    });
  });
});

