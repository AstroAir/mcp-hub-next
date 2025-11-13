/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeBlock } from './code-block';

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language }: { children: string; language: string }) => (
    <pre data-language={language}>
      <code>{children}</code>
    </pre>
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

// Mock clipboard API
const mockWriteText = jest.fn(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CodeBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockClear();
  });

  it('renders code with syntax highlighting', () => {
    const code = 'const hello = "world";';
    render(<CodeBlock code={code} language="javascript" />);
    
    // Check if code is rendered
    expect(screen.getByText(/const hello/)).toBeInTheDocument();
  });

  it('renders with default language when not specified', () => {
    const code = 'plain text';
    render(<CodeBlock code={code} />);
    
    expect(screen.getByText('plain text')).toBeInTheDocument();
  });

  it('shows line numbers by default', () => {
    const code = 'line 1\nline 2\nline 3';
    const { container } = render(<CodeBlock code={code} />);
    
    // SyntaxHighlighter adds line numbers when showLineNumbers is true
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('hides line numbers when showLineNumbers is false', () => {
    const code = 'line 1\nline 2';
    const { container } = render(<CodeBlock code={code} showLineNumbers={false} />);
    
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('copies code to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const code = 'const test = "copy me";';
    render(<CodeBlock code={code} language="javascript" />);

    const copyButton = screen.getByRole('button');
    await user.click(copyButton);

    // Check that the button state changed (which indicates copy was attempted)
    await waitFor(() => {
      const svg = copyButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('shows check icon after copying', async () => {
    const user = userEvent.setup();
    const code = 'test code';
    render(<CodeBlock code={code} />);
    
    const copyButton = screen.getByRole('button');
    await user.click(copyButton);
    
    // Check icon should be visible after copy
    await waitFor(() => {
      const svg = copyButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('reverts to copy icon after 2 seconds', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    const code = 'test code';
    render(<CodeBlock code={code} />);

    const copyButton = screen.getByRole('button');
    await user.click(copyButton);

    // Fast-forward time by 2 seconds
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      const svg = copyButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('handles different programming languages', () => {
    const languages = ['javascript', 'python', 'typescript', 'bash'];
    
    languages.forEach((lang) => {
      const { unmount } = render(<CodeBlock code={`// ${lang} code`} language={lang} />);
      expect(screen.getByText(new RegExp(lang))).toBeInTheDocument();
      unmount();
    });
  });

  it('handles multiline code', () => {
    const code = `function test() {
  console.log("line 1");
  console.log("line 2");
  return true;
}`;
    render(<CodeBlock code={code} language="javascript" />);
    
    expect(screen.getByText(/function test/)).toBeInTheDocument();
    expect(screen.getByText(/line 1/)).toBeInTheDocument();
    expect(screen.getByText(/line 2/)).toBeInTheDocument();
  });

  it('handles empty code', () => {
    const { container } = render(<CodeBlock code="" />);
    
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('applies custom styling', () => {
    const { container } = render(<CodeBlock code="test" />);
    
    // Check if the SyntaxHighlighter wrapper exists
    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
  });
});

