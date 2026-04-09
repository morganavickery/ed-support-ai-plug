export interface ServiceConfig {
  host: string;
  port: number;
  serviceName: string;
  modelProvider: "mock" | "ollama";
  ollamaBaseUrl: string;
  ollamaModel: string;
}

function readPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfig(): ServiceConfig {
  const provider = process.env.MODEL_PROVIDER === "ollama" ? "ollama" : "mock";

  return {
    host: process.env.HOST ?? "0.0.0.0",
    port: readPort(process.env.PORT, 3031),
    serviceName: "ed-support-ai-plug",
    modelProvider: provider,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api",
    ollamaModel: process.env.OLLAMA_MODEL ?? "gemma3:4b",
  };
}
