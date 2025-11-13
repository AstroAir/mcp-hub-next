import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./error-state";
import { Home } from "lucide-react";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe("ErrorState", () => {
  it("renders with default props", () => {
    render(<ErrorState />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An error occurred while processing your request.")
    ).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(
      <ErrorState
        title="Custom Error"
        description="This is a custom error description"
      />
    );

    expect(screen.getByText("Custom Error")).toBeInTheDocument();
    expect(screen.getByText("This is a custom error description")).toBeInTheDocument();
  });

  it("displays error message from Error object", () => {
    const error = new Error("Test error message");
    render(<ErrorState error={error} />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("displays error message from string", () => {
    render(<ErrorState error="String error message" />);

    expect(screen.getByText("String error message")).toBeInTheDocument();
  });

  it("does not display error alert when no error provided", () => {
    const { container } = render(<ErrorState />);

    // Alert should not be present
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeInTheDocument();
  });

  it("renders home button by default", () => {
    render(<ErrorState />);

    const homeButton = screen.getByRole("link", { name: /go to dashboard/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute("href", "/");
  });

  it("hides home button when showHomeButton is false", () => {
    render(<ErrorState showHomeButton={false} />);

    const homeButton = screen.queryByRole("link", { name: /go to dashboard/i });
    expect(homeButton).not.toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(<ErrorState onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("hides retry button when showRetryButton is false", () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} showRetryButton={false} />);

    const retryButton = screen.queryByRole("button", { name: /try again/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<ErrorState />);

    const retryButton = screen.queryByRole("button", { name: /try again/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it("renders custom icon", () => {
    const { container } = render(<ErrorState icon={Home} />);

    // Check that an icon is rendered
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<ErrorState className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders AlertCircle icon by default", () => {
    const { container } = render(<ErrorState />);

    // Should have at least one AlertCircle icon
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("renders both home and retry buttons when both are enabled", () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} showHomeButton={true} />);

    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toBeInTheDocument();
  });
});

