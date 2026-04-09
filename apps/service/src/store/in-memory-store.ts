import { randomUUID } from "node:crypto";

import type {
  ActivityEvent,
  ArtifactSnapshot,
  CreateThreadRequest,
  IdentifySessionRequest,
  IdentifySessionResponse,
  MessageRecord,
  StructuredAssistantResponse,
  ThreadRecord,
} from "@ed-support-ai-plug/shared-types";

interface SessionRecord extends IdentifySessionResponse {
  teacherPolicy: IdentifySessionRequest["teacherPolicy"];
  lessonContext: IdentifySessionRequest["lessonContext"];
  student: IdentifySessionRequest["student"];
  events: ActivityEvent[];
  snapshots: ArtifactSnapshot[];
}

export class InMemoryStore {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly threads = new Map<string, ThreadRecord>();

  public identifySession(input: IdentifySessionRequest): IdentifySessionResponse {
    const sessionId = randomUUID();
    const record: SessionRecord = {
      sessionId,
      classroomId: input.classroomId,
      toolName: input.toolName,
      studentId: input.student.studentId,
      lessonId: input.lessonContext.lessonId,
      teacherPolicy: input.teacherPolicy,
      lessonContext: input.lessonContext,
      student: input.student,
      events: [],
      snapshots: [],
    };

    this.sessions.set(sessionId, record);

    return {
      sessionId,
      classroomId: record.classroomId,
      toolName: record.toolName,
      studentId: record.studentId,
      lessonId: record.lessonId,
    };
  }

  public createThread(input: CreateThreadRequest): ThreadRecord {
    const thread: ThreadRecord = {
      id: randomUUID(),
      sessionId: input.sessionId,
      title: input.title,
      createdAt: new Date().toISOString(),
      messages: [],
    };

    this.threads.set(thread.id, thread);
    return thread;
  }

  public getThread(threadId: string): ThreadRecord | undefined {
    return this.threads.get(threadId);
  }

  public getSession(sessionId: string): SessionRecord | undefined {
    return this.sessions.get(sessionId);
  }

  public recordEvent(sessionId: string, event: ActivityEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown session: ${sessionId}`);
    }

    session.events.push({
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    });
  }

  public recordSnapshot(sessionId: string, snapshot: ArtifactSnapshot): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown session: ${sessionId}`);
    }

    session.snapshots.push(snapshot);
  }

  public appendUserMessage(threadId: string, content: string): MessageRecord {
    return this.appendMessage(threadId, "user", content);
  }

  public appendAssistantMessage(threadId: string, assistant: StructuredAssistantResponse): MessageRecord {
    return this.appendMessage(threadId, "assistant", assistant.studentReply);
  }

  public listRecentEvents(sessionId: string): ActivityEvent[] {
    return this.sessions.get(sessionId)?.events.slice(-8) ?? [];
  }

  public getLatestSnapshot(sessionId: string): ArtifactSnapshot | undefined {
    return this.sessions.get(sessionId)?.snapshots.at(-1);
  }

  private appendMessage(threadId: string, role: MessageRecord["role"], content: string): MessageRecord {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Unknown thread: ${threadId}`);
    }

    const message: MessageRecord = {
      id: randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString(),
    };

    thread.messages.push(message);
    return message;
  }
}
