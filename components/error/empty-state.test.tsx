import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./empty-state";
import { Search } from "lucide-react";

describe("EmptyState", () => {
  it("renders with default props", () => {
    render(<EmptyState />);

    expect(screen.getByText("No data found")).toBeInTheDocument();
    expect(
      screen.getByText("There is no data to display at the moment.")
    ).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search"
      />
    );

    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search")).toBeInTheDocument();
  });

  it("renders default Inbox icon", () => {
    const { container } = render(<EmptyState />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    const { container } = render(<EmptyState icon={Search} />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders action button when action is provided", () => {
    const action = {
      label: "Add Item",
      onClick: jest.fn(),
    };

    render(<EmptyState action={action} />);

    const button = screen.getByRole("button", { name: /add item/i });
    expect(button).toBeInTheDocument();
  });

  it("does not render action button when action is not provided", () => {
    render(<EmptyState />);

    const button = screen.queryByRole("button");
    expect(button).not.toBeInTheDocument();
  });

  it("calls action onClick when button is clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const action = {
      label: "Add Item",
      onClick,
    };

    render(<EmptyState action={action} />);

    const button = screen.getByRole("button", { name: /add item/i });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders children when provided", () => {
    render(
      <EmptyState>
        <div>Custom content</div>
      </EmptyState>
    );

    expect(screen.getByText("Custom content")).toBeInTheDocument();
  });

  it("does not render CardContent when no children", () => {
    const { container } = render(<EmptyState />);
    const cardContent = container.querySelector('[data-slot="card-content"]');
    expect(cardContent).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<EmptyState className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders complete empty state with all props", () => {
    const action = {
      label: "Create New",
      onClick: jest.fn(),
    };

    render(
      <EmptyState
        title="No servers"
        description="Get started by adding your first server"
        icon={Search}
        action={action}
        className="my-custom-class"
      >
        <div>Additional help text</div>
      </EmptyState>
    );

    expect(screen.getByText("No servers")).toBeInTheDocument();
    expect(
      screen.getByText("Get started by adding your first server")
    ).toBeInTheDocument();
    expect(screen.getByText("Additional help text")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
  });
});

