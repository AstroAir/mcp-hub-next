import { render, screen } from "@testing-library/react";
import { ServerStatusBadge } from "./server-status-badge";
import type { ConnectionStatus } from "@/lib/types";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      disconnected: "Disconnected",
      connecting: "Connecting",
      connected: "Connected",
      error: "Error",
      reconnecting: "Reconnecting",
    };
    return translations[key] || key;
  },
}));

describe("ServerStatusBadge", () => {
  const statuses: ConnectionStatus[] = [
    "disconnected",
    "connecting",
    "connected",
    "error",
    "reconnecting",
  ];

  it.each(statuses)("renders %s status", (status) => {
    render(<ServerStatusBadge status={status} />);
    const expectedText = status.charAt(0).toUpperCase() + status.slice(1);
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("renders disconnected status with correct styling", () => {
    const { container } = render(<ServerStatusBadge status="disconnected" />);
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    const circle = container.querySelector("svg");
    expect(circle).toHaveClass("text-gray-500");
  });

  it("renders connecting status with correct styling", () => {
    const { container } = render(<ServerStatusBadge status="connecting" />);
    expect(screen.getByText("Connecting")).toBeInTheDocument();
    const circle = container.querySelector("svg");
    expect(circle).toHaveClass("text-blue-500");
  });

  it("renders connected status with correct styling", () => {
    const { container } = render(<ServerStatusBadge status="connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    const circle = container.querySelector("svg");
    expect(circle).toHaveClass("text-green-500");
  });

  it("renders error status with correct styling", () => {
    const { container } = render(<ServerStatusBadge status="error" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    const circle = container.querySelector("svg");
    expect(circle).toHaveClass("text-red-500");
  });

  it("renders reconnecting status with correct styling", () => {
    const { container } = render(<ServerStatusBadge status="reconnecting" />);
    expect(screen.getByText("Reconnecting")).toBeInTheDocument();
    const circle = container.querySelector("svg");
    expect(circle).toHaveClass("text-yellow-500");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ServerStatusBadge status="connected" className="custom-class" />
    );
    const badge = container.firstChild;
    expect(badge).toHaveClass("custom-class");
  });

  it("renders with Circle icon", () => {
    const { container } = render(<ServerStatusBadge status="connected" />);
    const circle = container.querySelector("svg");
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveClass("h-2", "w-2", "fill-current");
  });
});

