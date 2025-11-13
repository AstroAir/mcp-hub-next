import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders badge with default variant", () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>);
    expect(screen.getByText("Default")).toBeInTheDocument();

    rerender(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText("Secondary")).toBeInTheDocument();

    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText("Destructive")).toBeInTheDocument();

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">Badge</Badge>);
    const badge = screen.getByText("Badge");
    expect(badge).toHaveClass("custom-class");
  });

  it("renders as child component when asChild is true", () => {
    render(
      <Badge asChild>
        <Link href="/test">Link Badge</Link>
      </Badge>
    );
    const link = screen.getByRole("link", { name: /link badge/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("renders as span by default", () => {
    const { container } = render(<Badge>Span Badge</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Span Badge");
  });

  it("forwards additional props", () => {
    render(
      <Badge aria-label="Test badge" data-testid="test-badge">
        Badge
      </Badge>
    );
    const badge = screen.getByTestId("test-badge");
    expect(badge).toHaveAttribute("aria-label", "Test badge");
  });

  it("renders with icon", () => {
    render(
      <Badge>
        <svg data-testid="badge-icon" />
        With Icon
      </Badge>
    );
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
    expect(screen.getByText("With Icon")).toBeInTheDocument();
  });

  it("supports aria-invalid attribute", () => {
    render(<Badge aria-invalid>Invalid Badge</Badge>);
    const badge = screen.getByText("Invalid Badge");
    expect(badge).toHaveAttribute("aria-invalid");
  });
});

