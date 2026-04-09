import type { ModelHealth, StructuredAssistantResponse } from "@ed-support-ai-plug/shared-types";

export interface GenerateResponseInput {
  systemPrompt: string;
  userPrompt: string;
}

export interface ModelAdapter {
  readonly provider: string;
  health(): Promise<ModelHealth>;
  generateResponse(input: GenerateResponseInput): Promise<StructuredAssistantResponse>;
}

export * from "./mock-model-adapter.js";
export * from "./ollama-model-adapter.js";
