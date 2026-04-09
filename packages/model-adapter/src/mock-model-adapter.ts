import type { StructuredAssistantResponse } from "@ed-support-ai-plug/shared-types";

import type { GenerateResponseInput, ModelAdapter } from "./index.js";

export class MockModelAdapter implements ModelAdapter {
  public readonly provider = "mock";

  public async health() {
    return {
      status: "ok" as const,
      provider: this.provider,
      details: "Mock provider is active. No local model runtime is required.",
    };
  }

  public async generateResponse(input: GenerateResponseInput): Promise<StructuredAssistantResponse> {
    const condensedQuestion = input.userPrompt
      .split("Student message:")
      .at(-1)
      ?.trim()
      .replace(/\s+/g, " ")
      .slice(0, 180);

    return {
      studentReply: `Let's work from the lesson materials and the artifact you already built. Start by identifying one claim you can support with evidence, then explain how it connects to your current task. ${
        condensedQuestion ? `You asked: "${condensedQuestion}".` : ""
      }`,
      teacherRationale: "Mock response returned so the service can be exercised before Ollama is configured.",
      usedSourceIds: [],
      needsHumanReview: false,
      policyFlags: [],
      suggestedFollowup: "What evidence from the tool or lesson materials supports your next step?",
    };
  }
}
