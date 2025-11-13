import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

describe("Tabs", () => {
  const renderTabs = () => {
    return render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
  };

  it("renders tabs component", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders all tab triggers", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
  });

  it("shows default tab content", () => {
    renderTabs();
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    // Content 2 and 3 are hidden (not in accessible tree)
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
  });

  it("switches tabs when clicked", async () => {
    const user = userEvent.setup();
    renderTabs();

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    await user.click(tab2);

    // Content 2 should be visible, Content 1 should be hidden
    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("marks active tab with data-state", async () => {
    const user = userEvent.setup();
    renderTabs();

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    const tab2 = screen.getByRole("tab", { name: "Tab 2" });

    expect(tab1).toHaveAttribute("data-state", "active");
    expect(tab2).toHaveAttribute("data-state", "inactive");

    await user.click(tab2);

    expect(tab1).toHaveAttribute("data-state", "inactive");
    expect(tab2).toHaveAttribute("data-state", "active");
  });

  it("supports controlled tabs", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const { rerender } = render(
      <Tabs value="tab1" onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    await user.click(tab2);

    expect(handleChange).toHaveBeenCalledWith("tab2");

    rerender(
      <Tabs value="tab2" onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("supports disabled tabs", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    expect(tab2).toBeDisabled();

    await user.click(tab2);
    // Tab 1 should still be active
    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    expect(tab1).toHaveAttribute("data-state", "active");
  });

  it("applies custom className to Tabs", () => {
    const { container } = render(
      <Tabs defaultValue="tab1" className="custom-tabs">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );
    const tabs = container.querySelector('[data-slot="tabs"]');
    expect(tabs).toHaveClass("custom-tabs");
  });

  it("applies custom className to TabsList", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );
    const tabsList = screen.getByRole("tablist");
    expect(tabsList).toHaveClass("custom-list");
  });

  it("applies custom className to TabsTrigger", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );
    const trigger = screen.getByRole("tab", { name: "Tab 1" });
    expect(trigger).toHaveClass("custom-trigger");
  });

  it("applies custom className to TabsContent", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content 1
        </TabsContent>
      </Tabs>
    );
    const content = container.querySelector('[data-slot="tabs-content"]');
    expect(content).toHaveClass("custom-content");
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    const { container } = renderTabs();

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });

    // Click to focus first
    await user.click(tab1);

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
  });

  it("has correct data-slot attributes", () => {
    const { container } = renderTabs();
    expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tabs-trigger"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument();
  });
});

