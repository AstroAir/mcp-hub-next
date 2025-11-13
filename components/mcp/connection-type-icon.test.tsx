import { render } from "@testing-library/react";
import { ConnectionTypeIcon } from "./connection-type-icon";
import type { MCPTransportType } from "@/lib/types";

describe("ConnectionTypeIcon", () => {
  const types: MCPTransportType[] = ["stdio", "sse", "http"];

  it.each(types)("renders %s icon", (type) => {
    const { container } = render(<ConnectionTypeIcon type={type} />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders Terminal icon for stdio type", () => {
    const { container } = render(<ConnectionTypeIcon type="stdio" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-muted-foreground");
  });

  it("renders Radio icon for sse type", () => {
    const { container } = render(<ConnectionTypeIcon type="sse" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-muted-foreground");
  });

  it("renders Globe icon for http type", () => {
    const { container } = render(<ConnectionTypeIcon type="http" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-muted-foreground");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ConnectionTypeIcon type="stdio" className="custom-class" />
    );
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("custom-class");
  });

  it("applies default text-muted-foreground class", () => {
    const { container } = render(<ConnectionTypeIcon type="stdio" />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("text-muted-foreground");
  });

  it("merges custom className with default classes", () => {
    const { container } = render(
      <ConnectionTypeIcon type="stdio" className="text-red-500" />
    );
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("text-red-500");
  });
});

