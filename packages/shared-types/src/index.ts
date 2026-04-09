import { z } from "zod";

export const SupportModeSchema = z.enum([
  "hint_only",
  "socratic",
  "evidence_first",
  "direct_explain",
  "challenge_student_thinking",
]);

export type SupportMode = z.infer<typeof SupportModeSchema>;

export const TeacherPolicySchema = z.object({
  mode: SupportModeSchema.default("hint_only"),
  systemGuidance: z.string().default(""),
  behaviorRules: z.array(z.string()).default([]),
});

export type TeacherPolicy = z.infer<typeof TeacherPolicySchema>;

export const LessonDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
});

export type LessonDocument = z.infer<typeof LessonDocumentSchema>;

export const LessonContextSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1),
  unitName: z.string().optional(),
  learningObjectives: z.array(z.string()).default([]),
  vocabulary: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  successCriteria: z.array(z.string()).default([]),
  approvedMaterials: z.array(LessonDocumentSchema).default([]),
});

export type LessonContext = z.infer<typeof LessonContextSchema>;

export const StudentProfileSchema = z.object({
  studentId: z.string().min(1),
  externalStudentRef: z.string().optional(),
  displayName: z.string().optional(),
  gradeBand: z.string().optional(),
  ageBand: z.string().optional(),
  readingLevel: z.string().optional(),
  profileNotes: z.array(z.string()).default([]),
});

export type StudentProfile = z.infer<typeof StudentProfileSchema>;

export const ArtifactSnapshotSchema = z.object({
  artifactId: z.string().min(1),
  artifactType: z.string().min(1),
  summary: z.string().optional(),
  snapshot: z.record(z.unknown()),
});

export type ArtifactSnapshot = z.infer<typeof ArtifactSnapshotSchema>;

export const ActivityEventSchema = z.object({
  eventType: z.string().min(1),
  timestamp: z.string().datetime().optional(),
  artifactId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
});

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

export const IdentifySessionRequestSchema = z.object({
  classroomId: z.string().min(1),
  toolName: z.string().min(1),
  lessonContext: LessonContextSchema,
  student: StudentProfileSchema,
  teacherPolicy: TeacherPolicySchema.default({
    mode: "hint_only",
    systemGuidance: "",
    behaviorRules: [],
  }),
});

export type IdentifySessionRequest = z.infer<typeof IdentifySessionRequestSchema>;

export const IdentifySessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  classroomId: z.string().min(1),
  toolName: z.string().min(1),
  studentId: z.string().min(1),
  lessonId: z.string().min(1),
});

export type IdentifySessionResponse = z.infer<typeof IdentifySessionResponseSchema>;

export const CreateThreadRequestSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().optional(),
});

export type CreateThreadRequest = z.infer<typeof CreateThreadRequestSchema>;

export const MessageRoleSchema = z.enum(["system", "user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageRecordSchema = z.object({
  id: z.string().min(1),
  role: MessageRoleSchema,
  content: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type MessageRecord = z.infer<typeof MessageRecordSchema>;

export const ThreadRecordSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  title: z.string().optional(),
  createdAt: z.string().datetime(),
  messages: z.array(MessageRecordSchema).default([]),
});

export type ThreadRecord = z.infer<typeof ThreadRecordSchema>;

export const CreateThreadResponseSchema = ThreadRecordSchema;
export type CreateThreadResponse = z.infer<typeof CreateThreadResponseSchema>;

export const RecordEventRequestSchema = z.object({
  sessionId: z.string().min(1),
  threadId: z.string().optional(),
  event: ActivityEventSchema,
});

export type RecordEventRequest = z.infer<typeof RecordEventRequestSchema>;

export const RecordArtifactSnapshotRequestSchema = z.object({
  sessionId: z.string().min(1),
  snapshot: ArtifactSnapshotSchema,
});

export type RecordArtifactSnapshotRequest = z.infer<typeof RecordArtifactSnapshotRequestSchema>;

export const PostMessageRequestSchema = z.object({
  content: z.string().min(1),
  selectionContext: z.string().optional(),
});

export type PostMessageRequest = z.infer<typeof PostMessageRequestSchema>;

export const StructuredAssistantResponseSchema = z.object({
  studentReply: z.string().min(1),
  teacherRationale: z.string().default(""),
  usedSourceIds: z.array(z.string()).default([]),
  needsHumanReview: z.boolean().default(false),
  policyFlags: z.array(z.string()).default([]),
  suggestedFollowup: z.string().optional(),
});

export type StructuredAssistantResponse = z.infer<typeof StructuredAssistantResponseSchema>;

export const PostMessageResponseSchema = z.object({
  thread: ThreadRecordSchema,
  assistant: StructuredAssistantResponseSchema,
});

export type PostMessageResponse = z.infer<typeof PostMessageResponseSchema>;

export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  service: z.string().min(1),
  provider: z.string().min(1),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ModelHealthSchema = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  provider: z.string().min(1),
  details: z.string().optional(),
});

export type ModelHealth = z.infer<typeof ModelHealthSchema>;
