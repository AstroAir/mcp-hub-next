import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole("textbox");

    await user.type(input, "Hello World");
    expect(input).toHaveValue("Hello World");
  });

  it("handles onChange event", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "test");
    expect(handleChange).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("renders with different input types", () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");

    rerender(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

    rerender(<Input type="password" />);
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it("forwards additional props", () => {
    render(<Input aria-label="Test input" maxLength={10} />);
    const input = screen.getByLabelText("Test input");
    expect(input).toHaveAttribute("maxLength", "10");
  });

  it("supports controlled input", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const { rerender } = render(<Input value="" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");

    await user.type(input, "a");
    expect(handleChange).toHaveBeenCalled();

    rerender(<Input value="test" onChange={handleChange} />);
    expect(input).toHaveValue("test");
  });

  it("supports aria-invalid attribute", () => {
    render(<Input aria-invalid />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid");
  });

  it("supports required attribute", () => {
    render(<Input required />);
    const input = screen.getByRole("textbox");
    expect(input).toBeRequired();
  });

  it("supports readonly attribute", () => {
    render(<Input readOnly value="readonly text" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("readonly text");
  });
});

