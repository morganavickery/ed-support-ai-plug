import { z } from "zod";

import {
  ActivityEventSchema,
  ArtifactSnapshotSchema,
  IdentifySessionRequestSchema,
  PostMessageRequestSchema,
} from "@ed-support-ai-plug/shared-types";

const ServiceBaseUrlSchema = z.string().url().optional();

export const DemoBootstrapRequestSchema = IdentifySessionRequestSchema.extend({
  serviceBaseUrl: ServiceBaseUrlSchema,
});

export const DemoEventRequestSchema = z.object({
  serviceBaseUrl: ServiceBaseUrlSchema,
  sessionId: z.string().min(1),
  threadId: z.string().min(1).optional(),
  event: ActivityEventSchema,
});

export const DemoSnapshotRequestSchema = z.object({
  serviceBaseUrl: ServiceBaseUrlSchema,
  sessionId: z.string().min(1),
  snapshot: ArtifactSnapshotSchema,
});

export const DemoMessageRequestSchema = PostMessageRequestSchema.extend({
  serviceBaseUrl: ServiceBaseUrlSchema,
  threadId: z.string().min(1),
});
