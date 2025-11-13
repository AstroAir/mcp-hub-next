import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card";

describe("Card Components", () => {
  describe("Card", () => {
    it("renders card element", () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText("Card content");
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute("data-slot", "card");
    });

    it("applies custom className", () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText("Content");
      expect(card).toHaveClass("custom-class");
    });

    it("forwards additional props", () => {
      render(
        <Card data-testid="test-card" aria-label="Test card">
          Content
        </Card>
      );
      const card = screen.getByTestId("test-card");
      expect(card).toHaveAttribute("aria-label", "Test card");
    });
  });

  describe("CardHeader", () => {
    it("renders card header", () => {
      render(<CardHeader>Header content</CardHeader>);
      const header = screen.getByText("Header content");
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute("data-slot", "card-header");
    });

    it("applies custom className", () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);
      const header = screen.getByText("Header");
      expect(header).toHaveClass("custom-header");
    });
  });

  describe("CardTitle", () => {
    it("renders card title", () => {
      render(<CardTitle>Title text</CardTitle>);
      const title = screen.getByText("Title text");
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute("data-slot", "card-title");
    });

    it("applies custom className", () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByText("Title");
      expect(title).toHaveClass("custom-title");
    });
  });

  describe("CardDescription", () => {
    it("renders card description", () => {
      render(<CardDescription>Description text</CardDescription>);
      const description = screen.getByText("Description text");
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute("data-slot", "card-description");
    });

    it("applies custom className", () => {
      render(
        <CardDescription className="custom-description">
          Description
        </CardDescription>
      );
      const description = screen.getByText("Description");
      expect(description).toHaveClass("custom-description");
    });
  });

  describe("CardAction", () => {
    it("renders card action", () => {
      render(<CardAction>Action content</CardAction>);
      const action = screen.getByText("Action content");
      expect(action).toBeInTheDocument();
      expect(action).toHaveAttribute("data-slot", "card-action");
    });

    it("applies custom className", () => {
      render(<CardAction className="custom-action">Action</CardAction>);
      const action = screen.getByText("Action");
      expect(action).toHaveClass("custom-action");
    });
  });

  describe("CardContent", () => {
    it("renders card content", () => {
      render(<CardContent>Content text</CardContent>);
      const content = screen.getByText("Content text");
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute("data-slot", "card-content");
    });

    it("applies custom className", () => {
      render(<CardContent className="custom-content">Content</CardContent>);
      const content = screen.getByText("Content");
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("CardFooter", () => {
    it("renders card footer", () => {
      render(<CardFooter>Footer content</CardFooter>);
      const footer = screen.getByText("Footer content");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute("data-slot", "card-footer");
    });

    it("applies custom className", () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);
      const footer = screen.getByText("Footer");
      expect(footer).toHaveClass("custom-footer");
    });
  });

  describe("Complete Card", () => {
    it("renders a complete card with all components", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card Description")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("Main content")).toBeInTheDocument();
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });
  });
});

