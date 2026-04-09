import Fastify from "fastify";

import { buildPrompt } from "@ed-support-ai-plug/prompt-builder";
import {
  ActivityEventSchema,
  CreateThreadRequestSchema,
  HealthResponseSchema,
  IdentifySessionRequestSchema,
  PostMessageRequestSchema,
  RecordArtifactSnapshotRequestSchema,
  RecordEventRequestSchema,
} from "@ed-support-ai-plug/shared-types";
import { MockModelAdapter, OllamaModelAdapter, type ModelAdapter } from "@ed-support-ai-plug/model-adapter";

import type { ServiceConfig } from "./config.js";
import { InMemoryStore } from "./store/in-memory-store.js";

function createModelAdapter(config: ServiceConfig): ModelAdapter {
  if (config.modelProvider === "ollama") {
    return new OllamaModelAdapter({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
    });
  }

  return new MockModelAdapter();
}

export function buildApp(config: ServiceConfig) {
  const app = Fastify({
    logger: true,
  });

  const store = new InMemoryStore();
  const modelAdapter = createModelAdapter(config);

  app.get("/health", async () => {
    return HealthResponseSchema.parse({
      status: "ok",
      service: config.serviceName,
      provider: modelAdapter.provider,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health/model", async (_request, reply) => {
    const modelHealth = await modelAdapter.health();
    reply.code(modelHealth.status === "down" ? 503 : 200);
    return modelHealth;
  });

  app.post("/v1/sessions/identify", async (request, reply) => {
    const body = IdentifySessionRequestSchema.parse(request.body);
    const session = store.identifySession(body);

    reply.code(201);
    return session;
  });

  app.post("/v1/threads", async (request, reply) => {
    const body = CreateThreadRequestSchema.parse(request.body);
    const session = store.getSession(body.sessionId);

    if (!session) {
      reply.code(404);
      return { error: "Session not found." };
    }

    const thread = store.createThread(body);
    reply.code(201);
    return thread;
  });

  app.get("/v1/threads/:threadId", async (request, reply) => {
    const params = request.params as { threadId: string };
    const thread = store.getThread(params.threadId);

    if (!thread) {
      reply.code(404);
      return { error: "Thread not found." };
    }

    return thread;
  });

  app.post("/v1/events", async (request, reply) => {
    const body = RecordEventRequestSchema.parse(request.body);
    ActivityEventSchema.parse(body.event);
    const session = store.getSession(body.sessionId);

    if (!session) {
      reply.code(404);
      return { error: "Session not found." };
    }

    store.recordEvent(body.sessionId, body.event);
    reply.code(201);
    return { ok: true as const };
  });

  app.post("/v1/artifact-snapshots", async (request, reply) => {
    const body = RecordArtifactSnapshotRequestSchema.parse(request.body);
    const session = store.getSession(body.sessionId);

    if (!session) {
      reply.code(404);
      return { error: "Session not found." };
    }

    store.recordSnapshot(body.sessionId, body.snapshot);
    reply.code(201);
    return { ok: true as const };
  });

  app.post("/v1/threads/:threadId/messages", async (request, reply) => {
    const params = request.params as { threadId: string };
    const body = PostMessageRequestSchema.parse(request.body);
    const thread = store.getThread(params.threadId);

    if (!thread) {
      reply.code(404);
      return { error: "Thread not found." };
    }

    const session = store.getSession(thread.sessionId);
    if (!session) {
      reply.code(404);
      return { error: "Session not found." };
    }

    store.appendUserMessage(thread.id, body.content);

    const prompt = buildPrompt({
      teacherPolicy: session.teacherPolicy,
      lessonContext: session.lessonContext,
      student: session.student,
      recentMessages: thread.messages,
      latestSnapshot: store.getLatestSnapshot(session.sessionId),
      recentEvents: store.listRecentEvents(session.sessionId),
      userMessage: body.content,
      selectionContext: body.selectionContext,
    });

    const assistant = await modelAdapter.generateResponse(prompt);
    store.appendAssistantMessage(thread.id, assistant);
    const updatedThread = store.getThread(thread.id);

    if (!updatedThread) {
      throw new Error(`Thread disappeared after message append: ${thread.id}`);
    }

    reply.code(201);
    return {
      thread: updatedThread,
      assistant,
    };
  });

  return app;
}
