import { act, renderHook } from "@testing-library/react";
import type { ChatMessage } from "../types";
import { useStreamingChat } from "./use-streaming-chat";

const originalFetch = global.fetch;
const mockFetch = jest.fn();

describe("useStreamingChat", () => {
  const messages: ChatMessage[] = [
    { id: "1", role: "user", content: "Hello", timestamp: "2024-01-01T00:00:00Z" },
    { id: "2", role: "assistant", content: "Hi", timestamp: "2024-01-01T00:01:00Z" },
  ];

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  });

  function createReader(events: unknown[]) {
    const encoder = new TextEncoder();
    const chunks = events.map((event) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

    const read = jest.fn();
    chunks.forEach((chunk) => {
      read.mockResolvedValueOnce({ done: false, value: chunk });
    });
    read.mockResolvedValueOnce({ done: true, value: undefined });

    return read;
  }

  it("streams content and triggers callbacks", async () => {
  const read = createReader([
      { type: "content_block_start", data: { content_block: { type: "tool_use", name: "search", input: { query: "test" } } } },
      { type: "content_block_delta", data: { delta: { type: "text_delta", text: "Hello" } } },
      { type: "content_block_delta", data: { delta: { type: "text_delta", text: " world" } } },
      { type: "tool_result", data: { tool_use_id: "tool-1", content: { result: "ok" } } },
      { type: "complete" },
    ]);

    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({ read }),
      },
    });

    const onChunk = jest.fn();
    const onComplete = jest.fn();
    const onToolUse = jest.fn();
    const onToolResult = jest.fn();

    const { result } = renderHook(() => useStreamingChat());

    let fullMessage = "";
    await act(async () => {
      fullMessage = await result.current.sendMessage(messages, ["server"], "claude", {
        onChunk,
        onComplete,
        onToolUse,
        onToolResult,
      });
    });

    expect(fullMessage).toBe("Hello world");
    expect(result.current.streamedContent).toBe("Hello world");
    expect(result.current.isStreaming).toBe(false);
    expect(onChunk).toHaveBeenCalledWith(expect.stringContaining("Hello"));
    expect(onComplete).toHaveBeenCalledWith("Hello world");
    expect(onToolUse).toHaveBeenCalledWith("search", { query: "test" });
    expect(onToolResult).toHaveBeenCalledWith("tool-1", { result: "ok" });
  });

  it("reports HTTP errors and calls onError", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const onError = jest.fn();
    const { result } = renderHook(() => useStreamingChat());

    await act(async () => {
      await expect(
        result.current.sendMessage(messages, [], "claude", { onError })
      ).rejects.toThrow("HTTP error! status: 500");
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.isStreaming).toBe(false);
  });

  it("resets state manually", async () => {
  const read = createReader([
      { type: "content_block_delta", data: { delta: { type: "text_delta", text: "chunk" } } },
      { type: "complete" },
    ]);

    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({ read }),
      },
    });

    const { result } = renderHook(() => useStreamingChat());

    await act(async () => {
      await result.current.sendMessage(messages, [], "claude");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.streamedContent).toBe("");
    expect(result.current.isStreaming).toBe(false);
  });
});
