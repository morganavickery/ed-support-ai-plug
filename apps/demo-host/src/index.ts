import Fastify from "fastify";

import { EdSupportAiClient } from "@ed-support-ai-plug/sdk";

import { getConfig } from "./config.js";
import { renderPage } from "./page.js";
import {
  DemoBootstrapRequestSchema,
  DemoEventRequestSchema,
  DemoMessageRequestSchema,
  DemoSnapshotRequestSchema,
} from "./schemas.js";

const config = getConfig();
const app = Fastify({
  logger: true,
});

function getClient(serviceBaseUrl?: string) {
  return new EdSupportAiClient({
    baseUrl: serviceBaseUrl ?? config.defaultServiceBaseUrl,
  });
}

app.setErrorHandler((error, _request, reply) => {
  const message = error instanceof Error ? error.message : "Unknown demo-host error.";
  reply.code(500).send({ error: message });
});

app.get("/", async (_request, reply) => {
  reply.type("text/html; charset=utf-8");
  return renderPage(config.defaultServiceBaseUrl);
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: config.serviceName,
    defaultServiceBaseUrl: config.defaultServiceBaseUrl,
    timestamp: new Date().toISOString(),
  };
});

app.post("/api/bootstrap", async (request, reply) => {
  const body = DemoBootstrapRequestSchema.parse(request.body);
  const client = getClient(body.serviceBaseUrl);
  const session = await client.identifySession({
    classroomId: body.classroomId,
    toolName: body.toolName,
    lessonContext: body.lessonContext,
    student: body.student,
    teacherPolicy: body.teacherPolicy,
  });
  const thread = await client.createThread({
    sessionId: session.sessionId,
    title: `Preview: ${body.lessonContext.title}`,
  });

  reply.code(201);
  return {
    serviceBaseUrl: body.serviceBaseUrl ?? config.defaultServiceBaseUrl,
    session,
    thread,
  };
});

app.post("/api/events", async (request, reply) => {
  const body = DemoEventRequestSchema.parse(request.body);
  const client = getClient(body.serviceBaseUrl);
  await client.recordEvent({
    sessionId: body.sessionId,
    threadId: body.threadId,
    event: body.event,
  });
  reply.code(201);
  return { ok: true as const };
});

app.post("/api/snapshots", async (request, reply) => {
  const body = DemoSnapshotRequestSchema.parse(request.body);
  const client = getClient(body.serviceBaseUrl);
  await client.recordArtifactSnapshot({
    sessionId: body.sessionId,
    snapshot: body.snapshot,
  });
  reply.code(201);
  return { ok: true as const };
});

app.post("/api/messages", async (request, reply) => {
  const body = DemoMessageRequestSchema.parse(request.body);
  const client = getClient(body.serviceBaseUrl);
  const response = await client.postMessage(body.threadId, {
    content: body.content,
    selectionContext: body.selectionContext,
  });
  reply.code(201);
  return response;
});

app.get("/api/threads/:threadId", async (request) => {
  const params = request.params as { threadId: string };
  const query = request.query as { serviceBaseUrl?: string };
  const client = getClient(query.serviceBaseUrl);
  return client.getThread(params.threadId);
});

async function start() {
  try {
    await app.listen({
      host: config.host,
      port: config.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
