import { jest } from "@jest/globals";

const invokeMock = jest.fn();

jest.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

describe("tauri-bridge", () => {
  beforeEach(() => {
    jest.resetModules();
    invokeMock.mockReset();
  });

  it("returns false for isTauri when window is undefined", async () => {
    const originalWindow = (globalThis as { window?: Window }).window;
    (globalThis as any).window = undefined;
    try {
      const { isTauri } = await import("./tauri-bridge");
      expect(isTauri()).toBe(false);
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });

  it("detects Tauri environment via injected globals", async () => {
    const originalWindow = (globalThis as { window?: Window }).window;
    if (!originalWindow) {
      throw new Error("window is not available in test environment");
    }

    const windowWithTauri = originalWindow as unknown as { __TAURI__?: unknown };
    const previousTauri = windowWithTauri.__TAURI__;
    windowWithTauri.__TAURI__ = {};

    try {
      const { isTauri } = await import("./tauri-bridge");
      expect(isTauri()).toBe(true);
    } finally {
      if (previousTauri === undefined) {
        delete windowWithTauri.__TAURI__;
      } else {
        windowWithTauri.__TAURI__ = previousTauri;
      }
      (globalThis as any).window = originalWindow;
    }
  });

  it("throws when invoking outside the Tauri runtime", async () => {
    const originalWindow = (globalThis as { window?: Window }).window;
    (globalThis as any).window = undefined;

    try {
      const { invoke } = await import("./tauri-bridge");
      await expect(invoke("command"))
        .rejects.toThrow("Tauri invoke called outside desktop runtime");
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });

  it("forwards invoke calls when running inside Tauri", async () => {
    const originalWindow = (globalThis as { window?: Window }).window;
    if (!originalWindow) {
      throw new Error("window is not available in test environment");
    }

    const windowWithTauri = originalWindow as unknown as { __TAURI__?: unknown };
    const previousTauri = windowWithTauri.__TAURI__;
    windowWithTauri.__TAURI__ = {};

    invokeMock.mockResolvedValueOnce("ok");

    try {
      const { invoke, isTauri } = await import("./tauri-bridge");
      expect(isTauri()).toBe(true);

      await expect(invoke("do_something", { value: 42 })).resolves.toBe("ok");
      expect(invokeMock).toHaveBeenCalledWith("do_something", { value: 42 });
    } finally {
      if (previousTauri === undefined) {
        delete windowWithTauri.__TAURI__;
      } else {
        windowWithTauri.__TAURI__ = previousTauri;
      }
      (globalThis as any).window = originalWindow;
    }
  });
});
