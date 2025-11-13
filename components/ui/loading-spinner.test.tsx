import { render } from "@testing-library/react";
import { LoadingSpinner } from "./loading-spinner";

describe("LoadingSpinner", () => {
  it("renders spinner with default size", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector("div");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("h-8", "w-8");
  });

  it("renders with small size", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector("div");
    expect(spinner).toHaveClass("h-4", "w-4");
  });

  it("renders with medium size", () => {
    const { container } = render(<LoadingSpinner size="md" />);
    const spinner = container.querySelector("div");
    expect(spinner).toHaveClass("h-8", "w-8");
  });

  it("renders with large size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector("div");
    expect(spinner).toHaveClass("h-12", "w-12");
  });

  it("applies custom className", () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.querySelector("div");
    expect(spinner).toHaveClass("custom-class");
  });

  it("has animate-spin class", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector("div");
    expect(spinner).toHaveClass("animate-spin");
  });

  it("has rounded-full class", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector("div");
    expect(spinner).toHaveClass("rounded-full");
  });

  it("has border classes", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector("div");
    expect(spinner).toHaveClass("border-2", "border-current", "border-t-transparent");
  });
});

