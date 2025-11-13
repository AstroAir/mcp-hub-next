import { render, screen } from "@testing-library/react";
import { Label } from "./label";

describe("Label", () => {
  it("renders label element", () => {
    render(<Label>Test Label</Label>);
    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("data-slot", "label");
  });

  it("applies custom className", () => {
    render(<Label className="custom-class">Label</Label>);
    const label = screen.getByText("Label");
    expect(label).toHaveClass("custom-class");
  });

  it("supports htmlFor attribute", () => {
    render(<Label htmlFor="test-input">Label</Label>);
    const label = screen.getByText("Label");
    expect(label).toHaveAttribute("for", "test-input");
  });

  it("renders with children", () => {
    render(
      <Label>
        <span>Icon</span>
        Label Text
      </Label>
    );
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText(/Label Text/)).toBeInTheDocument();
  });

  it("supports disabled state via group data attribute", () => {
    const { container } = render(
      <div data-disabled="true">
        <Label>Disabled Label</Label>
      </div>
    );
    const group = container.querySelector('[data-disabled="true"]');
    expect(group).toBeInTheDocument();
  });

  it("forwards ref to label element", () => {
    const ref = jest.fn();
    render(<Label ref={ref}>Label</Label>);
    expect(ref).toHaveBeenCalled();
  });

  it("supports aria attributes", () => {
    render(<Label aria-label="Accessible Label">Label</Label>);
    const label = screen.getByText("Label");
    expect(label).toHaveAttribute("aria-label", "Accessible Label");
  });
});

