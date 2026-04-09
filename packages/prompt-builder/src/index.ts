import type {
  ActivityEvent,
  ArtifactSnapshot,
  LessonContext,
  MessageRecord,
  StudentProfile,
  TeacherPolicy,
} from "@ed-support-ai-plug/shared-types";

export interface BuildPromptInput {
  teacherPolicy: TeacherPolicy;
  lessonContext: LessonContext;
  student: StudentProfile;
  recentMessages: MessageRecord[];
  latestSnapshot?: ArtifactSnapshot;
  recentEvents?: ActivityEvent[];
  userMessage: string;
  selectionContext?: string;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
}

const modeInstructions: Record<TeacherPolicy["mode"], string> = {
  hint_only: "Give hints and partial guidance. Do not complete the student's work.",
  socratic: "Lead with questions that help the student reason toward the answer.",
  evidence_first: "Ground each response in the approved lesson materials or artifact evidence before explaining.",
  direct_explain: "Give a concise direct explanation, but stay within the lesson context.",
  challenge_student_thinking: "Press the student to justify claims, compare alternatives, and refine reasoning.",
};

function joinList(items: string[], fallback = "None provided."): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : fallback;
}

function summarizeMessages(messages: MessageRecord[]): string {
  if (messages.length === 0) {
    return "No prior conversation in this thread.";
  }

  return messages
    .slice(-6)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

function summarizeEvents(events: ActivityEvent[]): string {
  if (events.length === 0) {
    return "No recent activity events.";
  }

  return events
    .slice(-8)
    .map((event) => `- ${event.eventType}${event.artifactId ? ` (${event.artifactId})` : ""}`)
    .join("\n");
}

function summarizeMaterials(lessonContext: LessonContext): string {
  if (lessonContext.approvedMaterials.length === 0) {
    return "No approved lesson materials were attached.";
  }

  return lessonContext.approvedMaterials
    .slice(0, 5)
    .map((doc) => `- [${doc.id}] ${doc.title}: ${doc.content}`)
    .join("\n");
}

export function buildPrompt(input: BuildPromptInput): BuiltPrompt {
  const systemPrompt = [
    "You are an educational support assistant embedded inside a classroom tool.",
    "Follow classroom policy and lesson materials before relying on general world knowledge.",
    modeInstructions[input.teacherPolicy.mode],
    input.teacherPolicy.systemGuidance ? `Teacher guidance: ${input.teacherPolicy.systemGuidance}` : "",
    input.teacherPolicy.behaviorRules.length > 0
      ? `Behavior rules:\n${joinList(input.teacherPolicy.behaviorRules)}`
      : "",
    `Lesson title: ${input.lessonContext.title}`,
    input.lessonContext.unitName ? `Unit: ${input.lessonContext.unitName}` : "",
    `Learning objectives:\n${joinList(input.lessonContext.learningObjectives)}`,
    `Vocabulary:\n${joinList(input.lessonContext.vocabulary)}`,
    `Misconceptions to watch for:\n${joinList(input.lessonContext.misconceptions)}`,
    `Success criteria:\n${joinList(input.lessonContext.successCriteria)}`,
    `Approved lesson materials:\n${summarizeMaterials(input.lessonContext)}`,
    `Student profile:\n- studentId: ${input.student.studentId}\n- gradeBand: ${
      input.student.gradeBand ?? "unknown"
    }\n- ageBand: ${input.student.ageBand ?? "unknown"}\n- readingLevel: ${
      input.student.readingLevel ?? "unknown"
    }\n${joinList(input.student.profileNotes)}`,
    "If you are uncertain, be explicit and ask the student to inspect the artifact, evidence, or teacher-provided materials.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const userPrompt = [
    input.selectionContext ? `Selection context:\n${input.selectionContext}` : "",
    input.latestSnapshot
      ? `Current artifact snapshot (${input.latestSnapshot.artifactType} / ${input.latestSnapshot.artifactId}):\n${
          input.latestSnapshot.summary ?? JSON.stringify(input.latestSnapshot.snapshot)
        }`
      : "No artifact snapshot was provided.",
    `Recent activity:\n${summarizeEvents(input.recentEvents ?? [])}`,
    `Recent conversation:\n${summarizeMessages(input.recentMessages)}`,
    `Student message:\n${input.userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    systemPrompt,
    userPrompt,
  };
}
