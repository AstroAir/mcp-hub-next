import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders textarea element", () => {
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("data-slot", "textarea");
  });

  it("renders with placeholder", () => {
    render(<Textarea placeholder="Enter description" />);
    const textarea = screen.getByPlaceholderText("Enter description");
    expect(textarea).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");

    await user.type(textarea, "Hello World");
    expect(textarea).toHaveValue("Hello World");
  });

  it("accepts multiline input", async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");

    await user.type(textarea, "Line 1{Enter}Line 2{Enter}Line 3");
    expect(textarea).toHaveValue("Line 1\nLine 2\nLine 3");
  });

  it("applies custom className", () => {
    render(<Textarea className="custom-class" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("custom-class");
  });

  it("supports disabled state", () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
  });

  it("supports readonly state", () => {
    render(<Textarea readOnly value="Read only text" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toHaveValue("Read only text");
  });

  it("supports controlled textarea", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const { rerender } = render(<Textarea value="" onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("");

    await user.type(textarea, "a");
    expect(handleChange).toHaveBeenCalled();

    rerender(<Textarea value="test" onChange={handleChange} />);
    expect(textarea).toHaveValue("test");
  });

  it("supports aria-invalid attribute", () => {
    render(<Textarea aria-invalid />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("aria-invalid");
  });

  it("supports required attribute", () => {
    render(<Textarea required />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeRequired();
  });

  it("supports rows attribute", () => {
    render(<Textarea rows={5} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("supports maxLength attribute", () => {
    render(<Textarea maxLength={100} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("maxLength", "100");
  });

  it("forwards ref to textarea element", () => {
    const ref = jest.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("supports name attribute for forms", () => {
    render(<Textarea name="description" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("name", "description");
  });

  it("supports defaultValue", () => {
    render(<Textarea defaultValue="Default text" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Default text");
  });
});

