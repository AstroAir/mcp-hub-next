import { screen } from "@testing-library/react";
import DashboardPage from "./page";
import { renderWithProviders } from "../lib/testing/test-utils";

describe("Dashboard Page", () => {
  it("renders the main heading and subtitle", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole("heading", { name: /MCP Server Hub/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Manage your Model Context Protocol servers/i)
    ).toBeInTheDocument();
  });

  it("renders key actions", () => {
    renderWithProviders(<DashboardPage />);
    // Primary actions
    expect(screen.getByRole("button", { name: /Add Server/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remote Servers/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Templates/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import\/Export/i })).toBeInTheDocument();
  });
});
