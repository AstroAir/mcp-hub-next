/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      close: 'Close',
    };
    return translations[key] || key;
  },
}));

describe('Dialog', () => {
  it('renders trigger button', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog content</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Open');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });
  });

  it('renders dialog header with title and description', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });

  it('renders dialog footer', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
  });

  it('shows close button by default', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('hides close button when showCloseButton is false', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    const closeButton = screen.queryByRole('button', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Content</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  it('can be controlled with open prop', () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Content</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    rerender(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Content</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onOpenChange when dialog state changes', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    
    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it('applies custom className to content', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent className="custom-class">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      const content = screen.getByText('Title').closest('[data-slot="dialog-content"]');
      expect(content).toHaveClass('custom-class');
    });
  });

  it('renders multiple dialogs independently', async () => {
    const user = userEvent.setup();

    render(
      <>
        <Dialog>
          <DialogTrigger>Open First</DialogTrigger>
          <DialogContent>
            <DialogTitle>First Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger>Open Second</DialogTrigger>
          <DialogContent>
            <DialogTitle>Second Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      </>
    );

    // Open first dialog
    await user.click(screen.getByText('Open First'));
    await waitFor(() => {
      expect(screen.getByText('First Dialog')).toBeInTheDocument();
    });

    // Close first dialog by pressing Escape
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('First Dialog')).not.toBeInTheDocument();
    });

    // Open second dialog
    await user.click(screen.getByText('Open Second'));
    await waitFor(() => {
      expect(screen.getByText('Second Dialog')).toBeInTheDocument();
    });
  });
});

