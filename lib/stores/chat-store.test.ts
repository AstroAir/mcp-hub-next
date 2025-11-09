import { act } from "@testing-library/react";
import type { ChatMessage } from "../types";

describe("useChatStore", () => {
  const now = new Date("2024-01-01T00:00:00Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  async function initStore() {
    jest.resetModules();
    return (await import("./chat-store")).useChatStore;
  }

  it("creates sessions and saves them", async () => {
    const useChatStore = await initStore();
    let sessionId = "";

    act(() => {
      sessionId = useChatStore.getState().createSession("My Session");
    });

    const state = useChatStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.currentSessionId).toBe(sessionId);
    expect(localStorage.getItem("mcp-chat-sessions")).not.toBeNull();
  });

  it("adds and updates messages in the active session", async () => {
    const useChatStore = await initStore();

    act(() => {
      useChatStore.getState().createSession("My Session");
    });

    const message: ChatMessage = {
      id: "msg-1",
      role: "user",
      content: "Hello",
      timestamp: new Date(now).toISOString(),
    };

    act(() => {
      useChatStore.getState().addMessage(message);
    });

    expect(useChatStore.getState().messages).toEqual([message]);

    act(() => {
      useChatStore.getState().updateMessage("msg-1", { content: "Updated" });
    });

    expect(useChatStore.getState().messages[0]?.content).toBe("Updated");
  });

  it("toggles servers and tracks active server", async () => {
    const useChatStore = await initStore();

    act(() => {
      useChatStore.getState().createSession("My Session");
    });

    act(() => {
      useChatStore.getState().toggleServer("server-a");
    });
    expect(useChatStore.getState().connectedServers).toEqual(["server-a"]);

    act(() => {
      useChatStore.getState().toggleServer("server-a");
    });
    expect(useChatStore.getState().connectedServers).toEqual([]);

    act(() => {
      useChatStore.getState().toggleServer("server-b");
      useChatStore.getState().setActiveServer("server-b");
    });

    expect(useChatStore.getState().connectedServers).toEqual(["server-b"]);
    expect(useChatStore.getState().activeServerId).toBe("server-b");
  });

  it("updates model and prompt optimization flags", async () => {
    const useChatStore = await initStore();

    act(() => {
      useChatStore.getState().createSession("My Session");
    });

    act(() => {
      useChatStore.getState().setModel("gpt-4o");
      useChatStore.getState().setOptimizePrompts(true);
    });

    const state = useChatStore.getState();
    expect(state.model).toBe("gpt-4o");
    expect(state.optimizePrompts).toBe(true);
  });

  it("clears messages from current session", async () => {
    const useChatStore = await initStore();

    act(() => {
      useChatStore.getState().createSession("My Session");
    });

    const message: ChatMessage = {
      id: "msg-1",
      role: "assistant",
      content: "Hello",
      timestamp: new Date(now).toISOString(),
    };

    act(() => {
      useChatStore.getState().addMessage(message);
    });

    act(() => {
      useChatStore.getState().clearMessages();
    });

    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("loads sessions from localStorage when available", async () => {
    const storedMessage: ChatMessage = {
      id: "msg-1",
      role: "user",
      content: "Persisted",
      timestamp: new Date(now).toISOString(),
    };

    const storedSession = {
      id: "session-1",
      title: "Saved Session",
      messages: [storedMessage],
      model: "claude-3-5-sonnet-20241022",
      connectedServers: ["server"],
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      activeServerId: null,
      optimizePrompts: true,
    };

    localStorage.setItem("mcp-chat-sessions", JSON.stringify([storedSession]));
    localStorage.setItem("mcp-current-session", "session-1");

    const useChatStore = await initStore();
    const state = useChatStore.getState();

    expect(state.sessions).toHaveLength(1);
    expect(state.currentSessionId).toBe("session-1");
    expect(state.messages).toEqual([storedMessage]);
    expect(state.optimizePrompts).toBe(true);
    expect(state.connectedServers).toEqual(["server"]);
  });
});
