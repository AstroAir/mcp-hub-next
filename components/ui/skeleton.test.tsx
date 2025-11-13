import { render } from "@testing-library/react";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders skeleton element", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector("div");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.querySelector("div");
    expect(skeleton).toHaveClass("custom-class");
  });

  it("has animate-pulse class", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector("div");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("has rounded-md class", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector("div");
    expect(skeleton).toHaveClass("rounded-md");
  });

  it("has bg-accent class", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector("div");
    expect(skeleton).toHaveClass("bg-accent");
  });

  it("forwards additional props", () => {
    const { container } = render(
      <Skeleton data-testid="test-skeleton" aria-label="Loading" />
    );
    const skeleton = container.querySelector("div");
    expect(skeleton).toHaveAttribute("data-testid", "test-skeleton");
    expect(skeleton).toHaveAttribute("aria-label", "Loading");
  });

  it("can be used with custom dimensions", () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const skeleton = container.querySelector("div");
    expect(skeleton).toHaveClass("h-4", "w-full");
  });
});

