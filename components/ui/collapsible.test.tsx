import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

describe('Collapsible', () => {
  const renderCollapsible = () => {
    return render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content to collapse</CollapsibleContent>
      </Collapsible>
    );
  };

  it('renders with data-slot attribute', () => {
    const { container } = renderCollapsible();
    const collapsible = container.querySelector('[data-slot="collapsible"]');
    expect(collapsible).toBeInTheDocument();
  });

  it('renders trigger with data-slot attribute', () => {
    const { container } = renderCollapsible();
    const trigger = container.querySelector('[data-slot="collapsible-trigger"]');
    expect(trigger).toBeInTheDocument();
  });

  it('renders content with data-slot attribute', () => {
    const { container } = renderCollapsible();
    const content = container.querySelector('[data-slot="collapsible-content"]');
    expect(content).toBeInTheDocument();
  });

  it('renders trigger button', () => {
    renderCollapsible();
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
  });

  it('hides content by default', () => {
    renderCollapsible();
    // Radix UI Collapsible removes hidden content from the DOM
    expect(screen.queryByText('Content to collapse')).not.toBeInTheDocument();
  });

  it('shows content when defaultOpen is true', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content to collapse</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Content to collapse')).toBeVisible();
  });

  it('toggles content when trigger is clicked', async () => {
    const user = userEvent.setup();
    renderCollapsible();

    const trigger = screen.getByRole('button', { name: 'Toggle' });

    // Initially hidden (not in DOM)
    expect(screen.queryByText('Content to collapse')).not.toBeInTheDocument();

    // Click to open
    await user.click(trigger);
    expect(screen.getByText('Content to collapse')).toBeVisible();

    // Click to close
    await user.click(trigger);
    expect(screen.queryByText('Content to collapse')).not.toBeInTheDocument();
  });

  it('supports controlled component pattern', async () => {
    const user = userEvent.setup();
    const handleOpenChange = jest.fn();

    render(
      <Collapsible open={false} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content to collapse</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('updates aria-expanded attribute on trigger', async () => {
    const user = userEvent.setup();
    renderCollapsible();

    const trigger = screen.getByRole('button', { name: 'Toggle' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('updates data-state attribute', async () => {
    const user = userEvent.setup();
    const { container } = renderCollapsible();

    const collapsible = container.querySelector('[data-slot="collapsible"]');
    const trigger = screen.getByRole('button', { name: 'Toggle' });

    expect(collapsible).toHaveAttribute('data-state', 'closed');

    await user.click(trigger);
    expect(collapsible).toHaveAttribute('data-state', 'open');
  });

  it('supports disabled state', () => {
    render(
      <Collapsible disabled>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content to collapse</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    expect(trigger).toBeDisabled();
  });

  it('forwards additional props to Collapsible', () => {
    const { container } = render(
      <Collapsible data-testid="test-collapsible">
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    const collapsible = container.querySelector('[data-testid="test-collapsible"]');
    expect(collapsible).toBeInTheDocument();
  });

  it('forwards additional props to CollapsibleTrigger', () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger data-testid="test-trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    const trigger = container.querySelector('[data-testid="test-trigger"]');
    expect(trigger).toBeInTheDocument();
  });

  it('forwards additional props to CollapsibleContent', () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="test-content">Content</CollapsibleContent>
      </Collapsible>
    );
    const content = container.querySelector('[data-testid="test-content"]');
    expect(content).toBeInTheDocument();
  });
});

