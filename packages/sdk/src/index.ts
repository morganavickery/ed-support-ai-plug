import {
  CreateThreadResponseSchema,
  HealthResponseSchema,
  IdentifySessionResponseSchema,
  PostMessageResponseSchema,
  ThreadRecordSchema,
  type CreateThreadRequest,
  type HealthResponse,
  type IdentifySessionRequest,
  type IdentifySessionResponse,
  type PostMessageRequest,
  type PostMessageResponse,
  type RecordArtifactSnapshotRequest,
  type RecordEventRequest,
  type ThreadRecord,
} from "@ed-support-ai-plug/shared-types";

export interface EdSupportAiClientOptions {
  baseUrl: string;
  apiKey?: string;
}

export class EdSupportAiClient {
  private readonly baseUrl: string;
  private readonly headers: HeadersInit;

  public constructor(options: EdSupportAiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.headers = options.apiKey
      ? {
          "x-api-key": options.apiKey,
        }
      : {};
  }

  public async health(): Promise<HealthResponse> {
    return this.request("/health", {
      method: "GET",
      schema: HealthResponseSchema,
    });
  }

  public async identifySession(input: IdentifySessionRequest): Promise<IdentifySessionResponse> {
    return this.request("/v1/sessions/identify", {
      method: "POST",
      body: input,
      schema: IdentifySessionResponseSchema,
    });
  }

  public async createThread(input: CreateThreadRequest): Promise<ThreadRecord> {
    return this.request("/v1/threads", {
      method: "POST",
      body: input,
      schema: CreateThreadResponseSchema,
    });
  }

  public async getThread(threadId: string): Promise<ThreadRecord> {
    return this.request(`/v1/threads/${threadId}`, {
      method: "GET",
      schema: ThreadRecordSchema,
    });
  }

  public async recordEvent(input: RecordEventRequest): Promise<{ ok: true }> {
    return this.request("/v1/events", {
      method: "POST",
      body: input,
      schema: undefined,
    });
  }

  public async recordArtifactSnapshot(input: RecordArtifactSnapshotRequest): Promise<{ ok: true }> {
    return this.request("/v1/artifact-snapshots", {
      method: "POST",
      body: input,
      schema: undefined,
    });
  }

  public async postMessage(threadId: string, input: PostMessageRequest): Promise<PostMessageResponse> {
    return this.request(`/v1/threads/${threadId}/messages`, {
      method: "POST",
      body: input,
      schema: PostMessageResponseSchema,
    });
  }

  private async request<T>(
    path: string,
    options: {
      method: "GET" | "POST";
      body?: unknown;
      schema?: { parse: (value: unknown) => T };
    },
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method,
      headers: {
        "content-type": "application/json",
        ...this.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request to ${path} failed with status ${response.status}.`);
    }

    const json = (await response.json()) as T;
    return options.schema ? options.schema.parse(json) : json;
  }
}
