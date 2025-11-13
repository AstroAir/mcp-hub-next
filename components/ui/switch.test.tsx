import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders switch element", () => {
    render(<Switch />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute("data-slot", "switch");
  });

  it("renders in unchecked state by default", () => {
    render(<Switch />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
    expect(switchElement).toHaveAttribute("aria-checked", "false");
  });

  it("toggles when clicked", async () => {
    const user = userEvent.setup();
    render(<Switch />);
    const switchElement = screen.getByRole("switch");

    expect(switchElement).toHaveAttribute("data-state", "unchecked");

    await user.click(switchElement);
    expect(switchElement).toHaveAttribute("data-state", "checked");
    expect(switchElement).toHaveAttribute("aria-checked", "true");

    await user.click(switchElement);
    expect(switchElement).toHaveAttribute("data-state", "unchecked");
    expect(switchElement).toHaveAttribute("aria-checked", "false");
  });

  it("supports controlled state", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const { rerender } = render(<Switch checked={false} onCheckedChange={handleChange} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "unchecked");

    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(true);

    rerender(<Switch checked={true} onCheckedChange={handleChange} />);
    expect(switchElement).toHaveAttribute("data-state", "checked");
  });

  it("supports disabled state", () => {
    render(<Switch disabled />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDisabled();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Switch disabled onCheckedChange={handleChange} />);
    const switchElement = screen.getByRole("switch");

    await user.click(switchElement);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Switch className="custom-class" />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveClass("custom-class");
  });

  it("supports defaultChecked prop", () => {
    render(<Switch defaultChecked />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("data-state", "checked");
  });

  it("supports aria-label", () => {
    render(<Switch aria-label="Toggle notifications" />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toHaveAttribute("aria-label", "Toggle notifications");
  });

  it("forwards ref to switch element", () => {
    const ref = jest.fn();
    render(<Switch ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("renders switch thumb", () => {
    const { container } = render(<Switch />);
    const thumb = container.querySelector('[data-slot="switch-thumb"]');
    expect(thumb).toBeInTheDocument();
  });
});

