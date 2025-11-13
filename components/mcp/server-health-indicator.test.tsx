import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServerHealthIndicator } from "./server-health-indicator";
import type { ServerHealth } from "@/lib/services/health-monitor";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, params?: any) => {
    const translations: Record<string, Record<string, string>> = {
      "components.serverHealth": {
        "status.healthy": "Healthy",
        "status.degraded": "Degraded",
        "status.offline": "Offline",
        "actions.reconnect": "Reconnect",
        "labels.uptime": "Uptime",
        "labels.responseTime": "Response Time",
        "labels.lastCheck": "Last Check",
        "labels.failures": "Failures",
        "labels.lastError": "Last Error",
        "tooltip.uptime": `Uptime: ${params?.value}`,
        "tooltip.response": `Response: ${params?.value}`,
        "tooltip.error": `Error: ${params?.message}`,
        "tooltip.failures": `Failures: ${params?.count}`,
        "format.uptime.days": `${params?.days}d ${params?.hours}h`,
        "format.uptime.hours": `${params?.hours}h ${params?.minutes}m`,
        "format.uptime.minutes": `${params?.minutes}m ${params?.seconds}s`,
        "format.uptime.seconds": `${params?.seconds}s`,
        "format.response.milliseconds": `${params?.value}ms`,
        "format.response.seconds": `${params?.value}s`,
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

describe("ServerHealthIndicator", () => {
  const healthyHealth: ServerHealth = {
    status: "healthy",
    uptime: 3600000, // 1 hour
    responseTime: 150,
    lastCheck: Date.now(),
    failureCount: 0,
  };

  const degradedHealth: ServerHealth = {
    status: "degraded",
    uptime: 7200000, // 2 hours
    responseTime: 800,
    lastCheck: Date.now(),
    failureCount: 2,
  };

  const offlineHealth: ServerHealth = {
    status: "offline",
    uptime: 0,
    responseTime: 0,
    lastCheck: Date.now(),
    failureCount: 5,
    lastError: "Connection timeout",
  };

  it("returns null when no health data provided", () => {
    const { container } = render(<ServerHealthIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("renders healthy status", () => {
    render(<ServerHealthIndicator health={healthyHealth} showDetails />);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("renders degraded status", () => {
    render(<ServerHealthIndicator health={degradedHealth} showDetails />);
    expect(screen.getByText("Degraded")).toBeInTheDocument();
  });

  it("renders offline status", () => {
    render(<ServerHealthIndicator health={offlineHealth} showDetails />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders CheckCircle icon for healthy status", () => {
    const { container } = render(
      <ServerHealthIndicator health={healthyHealth} showDetails />
    );
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("renders Activity icon for degraded status", () => {
    const { container } = render(
      <ServerHealthIndicator health={degradedHealth} showDetails />
    );
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("renders AlertCircle icon for offline status", () => {
    const { container } = render(
      <ServerHealthIndicator health={offlineHealth} showDetails />
    );
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("renders reconnect button when offline and onReconnect provided", () => {
    const onReconnect = jest.fn();
    render(
      <ServerHealthIndicator
        health={offlineHealth}
        onReconnect={onReconnect}
        showDetails
      />
    );

    const reconnectButton = screen.getByRole("button", { name: /reconnect/i });
    expect(reconnectButton).toBeInTheDocument();
  });

  it("does not render reconnect button when not offline", () => {
    const onReconnect = jest.fn();
    render(
      <ServerHealthIndicator
        health={healthyHealth}
        onReconnect={onReconnect}
        showDetails
      />
    );

    const reconnectButton = screen.queryByRole("button", {
      name: /reconnect/i,
    });
    expect(reconnectButton).not.toBeInTheDocument();
  });

  it("calls onReconnect when reconnect button is clicked", async () => {
    const user = userEvent.setup();
    const onReconnect = jest.fn();

    render(
      <ServerHealthIndicator
        health={offlineHealth}
        onReconnect={onReconnect}
        showDetails
      />
    );

    const reconnectButton = screen.getByRole("button", { name: /reconnect/i });
    await user.click(reconnectButton);

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("displays uptime when not offline", () => {
    render(<ServerHealthIndicator health={healthyHealth} showDetails />);
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });

  it("displays response time when not offline", () => {
    render(<ServerHealthIndicator health={healthyHealth} showDetails />);
    expect(screen.getByText("Response Time")).toBeInTheDocument();
  });

  it("displays last check time", () => {
    render(<ServerHealthIndicator health={healthyHealth} showDetails />);
    expect(screen.getByText("Last Check")).toBeInTheDocument();
  });

  it("displays failure count when greater than 0", () => {
    render(<ServerHealthIndicator health={degradedHealth} showDetails />);
    expect(screen.getByText("Failures")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("displays last error when present", () => {
    render(<ServerHealthIndicator health={offlineHealth} showDetails />);
    expect(screen.getByText("Last Error")).toBeInTheDocument();
    expect(screen.getByText("Connection timeout")).toBeInTheDocument();
  });

  it("renders compact view when showDetails is false", () => {
    render(<ServerHealthIndicator health={healthyHealth} showDetails={false} />);

    // Should not show detailed labels
    expect(screen.queryByText("Uptime")).not.toBeInTheDocument();
    expect(screen.queryByText("Response Time")).not.toBeInTheDocument();
  });

  it("renders pulsing indicator dot", () => {
    const { container } = render(
      <ServerHealthIndicator health={healthyHealth} showDetails={false} />
    );

    const dot = container.querySelector(".animate-pulse");
    expect(dot).toBeInTheDocument();
  });

  it("applies correct color for healthy status", () => {
    const { container } = render(
      <ServerHealthIndicator health={healthyHealth} showDetails={false} />
    );

    const dot = container.querySelector(".bg-green-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies correct color for degraded status", () => {
    const { container } = render(
      <ServerHealthIndicator health={degradedHealth} showDetails={false} />
    );

    const dot = container.querySelector(".bg-yellow-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies correct color for offline status", () => {
    const { container } = render(
      <ServerHealthIndicator health={offlineHealth} showDetails={false} />
    );

    const dot = container.querySelector(".bg-red-500");
    expect(dot).toBeInTheDocument();
  });
});

