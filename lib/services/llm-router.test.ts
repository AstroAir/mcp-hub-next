import { complete } from "./llm-router";
import type { ChatMessage } from "../types";

// Mock Anthropic SDK
const mockMessagesCreate = jest.fn().mockResolvedValue({
  content: [{ type: "text", text: "Anthropic response" }],
});

jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  }));
});

// Mock model store
jest.mock("@/lib/stores/model-store", () => ({
  useModelStore: {
    getState: jest.fn(() => ({
      getModel: jest.fn((id: string) => {
        // Return undefined for unsupported models to let inferProviderFromModelId handle it
        if (id === "unsupported-model") return undefined;
        return {
          id,
          label: id,
          provider: id.startsWith("claude") ? "anthropic" : "openai",
        };
      }),
    })),
  },
}));

describe("llm-router", () => {
  const mockMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: "Hello",
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("complete", () => {
    it("routes to Anthropic for Claude models", async () => {
      const result = await complete({
        model: "claude-3-5-sonnet-20241022",
        messages: mockMessages,
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-3-5-sonnet-20241022",
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: "Hello",
            }),
          ]),
        })
      );
      expect(result.text).toBe("Anthropic response");
    });

    it("uses custom options for Anthropic", async () => {
      await complete({
        model: "claude-3-5-sonnet-20241022",
        messages: mockMessages,
        options: {
          maxTokens: 2048,
          temperature: 0.5,
        },
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2048,
          temperature: 0.5,
        })
      );
    });

    it("routes to OpenAI for GPT models", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "OpenAI response" } }],
        }),
      });

      const result = await complete({
        model: "gpt-4o",
        messages: mockMessages,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/chat/completions"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("gpt-4o"),
        })
      );
      expect(result.text).toBe("OpenAI response");
    });

    it("handles OpenAI errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        complete({
          model: "gpt-4o",
          messages: mockMessages,
        })
      ).rejects.toThrow("OpenAI error 401");
    });

    it("uses custom options for OpenAI", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Response" } }],
        }),
      });

      await complete({
        model: "gpt-4o",
        messages: mockMessages,
        options: {
          maxTokens: 1024,
          temperature: 0.3,
        },
      });

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.max_tokens).toBe(1024);
      expect(callBody.temperature).toBe(0.3);
    });

    it("throws error for unsupported providers", async () => {
      await expect(
        complete({
          model: "unsupported-model",
          messages: mockMessages,
        })
      ).rejects.toThrow("Provider not supported");
    });
  });

  describe("provider inference", () => {
    it("infers anthropic from claude prefix", async () => {
      await complete({
        model: "claude-3-opus-20240229",
        messages: mockMessages,
      });

      expect(mockMessagesCreate).toHaveBeenCalled();
    });

    it("infers openai from gpt prefix", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Response" } }],
        }),
      });

      await complete({
        model: "gpt-3.5-turbo",
        messages: mockMessages,
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("message formatting", () => {
    it("converts messages to Anthropic format", async () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "user",
          content: "Hello",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          role: "assistant",
          content: "Hi there",
          timestamp: new Date().toISOString(),
        },
      ];

      await complete({
        model: "claude-3-5-sonnet-20241022",
        messages,
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi there" },
          ],
        })
      );
    });

    it("converts messages to OpenAI format", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Response" } }],
        }),
      });

      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "user",
          content: "Hello",
          timestamp: new Date().toISOString(),
        },
      ];

      await complete({
        model: "gpt-4o",
        messages,
      });

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.messages).toEqual([{ role: "user", content: "Hello" }]);
    });
  });
});

