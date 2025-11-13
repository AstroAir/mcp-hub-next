import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorAlert } from "./error-alert";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      "components.errorAlert": {
        title: "Error",
      },
      "common.actions": {
        close: "Close",
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

describe("ErrorAlert", () => {
  it("renders error message", () => {
    render(<ErrorAlert message="Test error message" />);
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders default title when no title provided", () => {
    render(<ErrorAlert message="Test error" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(<ErrorAlert title="Custom Error" message="Test error" />);
    expect(screen.getByText("Custom Error")).toBeInTheDocument();
  });

  it("renders AlertCircle icon", () => {
    const { container } = render(<ErrorAlert message="Test error" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders dismiss button when onDismiss is provided", () => {
    const onDismiss = jest.fn();
    render(<ErrorAlert message="Test error" onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole("button", { name: /close/i });
    expect(dismissButton).toBeInTheDocument();
  });

  it("does not render dismiss button when onDismiss is not provided", () => {
    render(<ErrorAlert message="Test error" />);

    const dismissButton = screen.queryByRole("button", { name: /close/i });
    expect(dismissButton).not.toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();

    render(<ErrorAlert message="Test error" onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole("button", { name: /close/i });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders with destructive variant", () => {
    const { container } = render(<ErrorAlert message="Test error" />);
    // Alert component should have destructive styling
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });

  it("renders X icon in dismiss button", () => {
    const onDismiss = jest.fn();
    const { container } = render(
      <ErrorAlert message="Test error" onDismiss={onDismiss} />
    );

    // Should have at least 2 SVG icons (AlertCircle + X)
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });
});

