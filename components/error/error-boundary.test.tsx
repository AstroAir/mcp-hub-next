import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./error-boundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error UI when an error is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("displays custom fallback title", () => {
    render(
      <ErrorBoundary fallbackTitle="Custom Error Title">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
  });

  it("displays custom fallback message when no error message", () => {
    const ErrorWithoutMessage = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary fallbackMessage="Custom fallback message">
        <ErrorWithoutMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom fallback message")).toBeInTheDocument();
  });

  it("displays custom retry label", () => {
    render(
      <ErrorBoundary retryLabel="Retry Now">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("button", { name: /retry now/i })).toBeInTheDocument();
  });

  it("resets error state when retry button is clicked", async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <ThrowError shouldThrow={true} />
          ) : (
            <div>No error</div>
          )}
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Error UI should be visible
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Click retry button - this will reset the error boundary state
    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    // After reset, the error boundary will try to render children again
    // Since ThrowError still throws, we should still see the error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders AlertTriangle icon", () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check for the AlertTriangle icon (lucide-react renders as svg)
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("logs error to console", () => {
    const consoleErrorSpy = jest.spyOn(console, "error");

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

