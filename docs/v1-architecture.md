# ed-support-ai-plug V1 Architecture

## Purpose

`ed-support-ai-plug` is a reusable local AI service for classroom tools. It is intended to run on a single server computer within a classroom or lab while students access host applications from their own devices over the same local network.

The plugin is not just a chat widget. It is a context-aware service that helps students within the boundaries of a specific lesson, activity, and classroom policy.

## V1 Goals

V1 should solve five concrete problems:


1. Provide a stable API that multiple host applications can integrate with.
2. Generate student-facing responses using lesson context, current app state, student profile, and prior chat history.
3. Allow instructors to define classroom-wide prompting, lesson materials, and guidance rules without editing code.
4. Run entirely on local hardware without depending on external cloud APIs.
5. Preserve enough traceability for research, debugging, and instructional review.

## V1 Non-Goals

V1 should explicitly avoid these concerns:

* Agentic workflows with broad tool access
* Autonomous grading or scoring
* Cross-school multi-tenant hosting
* Fine-tuning custom models
* Real-time voice, image, or multimodal interaction
* Large-scale analytics infrastructure
* Sophisticated vector infrastructure beyond what is needed for local classroom retrieval

## Primary Use Cases

### MEME-like tools

Students construct concept maps or evidence maps. The AI should know:

* the current model or artifact state
* the lesson objective and approved source materials
* the evidence library and criteria for strong explanations
* the student profile and prior conversation

Typical support behaviors:

* ask guiding questions
* explain concepts using lesson language
* point students toward evidence already available in the tool
* help them compare competing model elements without directly completing the work for them

### Net.Create-like tools

Students enter nodes, edges, citations, and interpretations collaboratively. The AI should know:

* what the student or group has already entered
* the coding schema and attribution rules
* the current network view and selected entities
* the lesson frame and instructor guidance for interpretation

Typical support behaviors:

* clarify coding conventions
* help students distinguish node vs edge choices
* ask for evidence or citations
* suggest checks for duplicates or ambiguity

## Core Product Shape

V1 consists of four layers:


1. Host applications such as MEME or Net.Create
2. A small integration SDK used by host applications
3. A local AI service that owns context assembly, memory, retrieval, and policy
4. A local model runtime that the AI service calls for generation and embeddings

The host app should not call the model directly. The host app calls the AI service. This keeps policy, lesson retrieval, student memory, and safety logic in one place.

## Deployment Model

### Classroom deployment

* One teacher or server laptop runs the host application and the AI service
* Students connect from their browsers over the same Wi-Fi network
* The model runtime is bound to `localhost` on the server computer
* The AI service is reachable from the LAN
* The host app and AI service may run as separate processes or under one local launcher

### Target topology

```text
Student Browser
  -> Host App UI
  -> Host App Server
  -> ed-support-ai-plug API
     -> SQLite database
     -> lesson content index
     -> local model runtime
```

### Packaging

V1 packaging should prioritize ease of setup over perfect abstraction:

* development: `docker compose`
* deployable local server: `Node.js` process plus local model runtime
* optional later packaging: Electron shell or simple desktop installer

## Recommended Stack

### Application layer

* `Node.js`
* `TypeScript`
* `Fastify`
* `Zod`

Reasoning:

* aligns with existing Node/Electron educational tools
* straightforward for browser-based classroom apps
* easy shared typing between host apps and plugin SDK
* good performance for streaming and event ingestion

### Model runtime

Primary recommendation:

* `Ollama`

Fallback or advanced-control option:

* `llama.cpp`

Reasoning:

* both run locally on one machine
* Ollama provides a stable local HTTP API with chat, embeddings, tool calling, and structured outputs
* `llama.cpp` is useful if tighter packaging or lower-level tuning becomes important later

### Data layer

V1 default:

* `SQLite` in WAL mode
* `FTS5` for lesson and artifact text retrieval

Upgrade path:

* `PostgreSQL` plus `pgvector` if concurrency or retrieval complexity outgrows SQLite

Reasoning:

* single-file persistence is practical for one classroom server
* fewer moving parts than running Postgres in every small deployment
* adequate for pseudonymous users and modest concurrent load
* full-text search is enough for early lesson retrieval if lesson materials are curated

Important implementation note:

* if using WAL mode, use SQLite `3.51.3` or newer because the SQLite project documents a rare WAL-reset corruption bug fixed on March 13, 2026

### Transport

* `HTTP` for CRUD and event ingest
* `Server-Sent Events` for streaming chat output
* `WebSocket` only if the host app already requires it for other collaborative state

## System Components

### 1. Integration SDK

This is the thin client used by host applications.

Responsibilities:

* authenticate a host app against the local AI service
* submit structured activity events
* start or resume a student chat thread
* stream assistant responses
* optionally fetch teacher config relevant to the current session

Recommended surface:

* `identifySession()`
* `recordEvent()`
* `sendMessage()`
* `streamResponse()`
* `getThread()`
* `getLessonContext()`

The SDK should stay intentionally small. It should not duplicate server-side prompt logic.

### 2. AI Service

This is the core of the system.

Responsibilities:

* authenticate requests from host apps
* store users, sessions, threads, events, and lesson data
* assemble context from multiple sources
* retrieve lesson materials and prior memory
* build prompts and tool definitions
* call the local model runtime
* store traces and outputs
* enforce classroom policy and response shaping

### 3. Teacher Console

V1 should expose a basic teacher-facing web interface or admin routes.

Responsibilities:

* create or edit lesson packs
* define classroom prompt defaults
* set response style and support mode
* upload lesson materials or evidence-library content
* inspect recent conversations and traces

V1 does not need a full LMS-style interface. A minimal admin dashboard is enough.

### 4. Model Runtime Adapter

This is a narrow internal abstraction over Ollama or `llama.cpp`.

Responsibilities:

* create chat completions
* request embeddings
* support structured output parsing
* expose model health and availability

This adapter keeps the rest of the system insulated from a specific runtime.

## Context Model

The central product requirement is context assembly. V1 should treat context as structured data, not as a flat prompt blob.

### Context sources


1. Classroom policy context
2. Active lesson context
3. Student profile context
4. Current activity and artifact context
5. Prior conversation context

### 1. Classroom policy context

Defined by instructor or facilitator.

Examples:

* response style: hint-first, Socratic, direct explanation, evidence-first
* disallowed behaviors: do not give final answers, do not write text for the student, do not cite outside the lesson pack
* classroom norms: encourage collaboration, ask for evidence, keep explanations age-appropriate

### 2. Active lesson context

This is the highest-priority content context.

Examples:

* lesson title
* unit and week
* learning objectives
* target vocabulary
* misconceptions to watch for
* approved lesson content
* evidence library or citations
* rubric or success criteria
* task instructions for the current activity

Prompt rule:

When lesson materials conflict with general model knowledge, the model should follow the lesson pack unless the teacher has configured otherwise.

### 3. Student profile context

Examples:

* pseudonymous student id
* age band or grade
* reading level, if provided
* preferred scaffolding level
* accessibility or accommodation flags, if the research protocol permits storing them

V1 should minimize stored personal data. Prefer pseudonymous identifiers.

### 4. Current activity and artifact context

This is the most application-specific input.

Examples for MEME:

* current concept map nodes and links
* evidence attached to claims
* selected model element
* comment thread on the current model

Examples for Net.Create:

* current node and edge entries
* duplicate candidates
* selected graph objects
* current citation status

The host app should send structured snapshots and events rather than forcing the AI service to scrape raw UI state.

### 5. Prior conversation context

V1 should use:

* recent raw turns from the current thread
* rolling summaries of older turns
* a lightweight memory record for durable student preferences or recurring misconceptions

Memory should be scoped by student, classroom, and tool. It should not become a global profile across unrelated studies or deployments.

## Host App Integration Contract

Each host app should integrate using two patterns:


1. event ingestion
2. chat interaction

### Event ingestion

Host apps publish structured events to the AI service whenever the student does something meaningful.

Examples:

* `session_started`
* `artifact_opened`
* `node_added`
* `edge_added`
* `concept_linked`
* `evidence_attached`
* `comment_posted`
* `selection_changed`
* `view_changed`
* `submission_requested`

Each event should include:

* `event_type`
* `timestamp`
* `tool_name`
* `classroom_id`
* `lesson_id`
* `session_id`
* `student_id`
* `artifact_id`
* `payload`

### Artifact snapshots

For retrieval and prompt assembly, host apps should occasionally send compact snapshots of the current artifact state.

Examples:

* current concept map as normalized JSON
* current network coding table summary
* selected entity details
* recent evidence links

Snapshots are more useful than reconstructing state from a long event stream on every request.

### Chat interaction

When the student sends a chat message, the host app should provide:

* the current thread id
* the student message
* the active lesson id
* the current artifact snapshot id or inline compact state
* optional UI selection context

The AI service should respond as a stream plus trace metadata.

## Proposed API Surface

The API below is intentionally small. It is enough for one or more host apps to adopt the service without coupling to internal implementation.

### Teacher/admin routes

* `POST /v1/classrooms`
* `POST /v1/classrooms/:classroomId/lesson-packs`
* `PUT /v1/lesson-packs/:lessonPackId`
* `POST /v1/classrooms/:classroomId/policies`
* `GET /v1/classrooms/:classroomId/threads`
* `GET /v1/threads/:threadId`

### Host app routes

* `POST /v1/sessions/identify`
* `POST /v1/events`
* `POST /v1/artifact-snapshots`
* `POST /v1/threads`
* `POST /v1/threads/:threadId/messages`
* `GET /v1/threads/:threadId/stream`
* `GET /v1/classrooms/:classroomId/active-context`

### Health and ops routes

* `GET /health`
* `GET /health/model`
* `GET /health/db`

## Example Chat Flow


1. Student logs into a host app using a classroom-specific identifier.
2. Host app calls `POST /v1/sessions/identify`.
3. Host app sends major activity events and periodic snapshots during the session.
4. Student opens the chat and sends a question.
5. Host app calls `POST /v1/threads/:threadId/messages`.
6. AI service assembles context:
   * classroom policy
   * active lesson pack
   * student profile
   * recent events
   * latest artifact snapshot
   * prior thread summary and recent turns
   * retrieval hits from lesson materials
7. AI service calls the model runtime.
8. Response is streamed back to the host app.
9. Final answer, structured metadata, and trace are stored.

## Prompting and Response Policy

V1 should not rely on one giant freeform system prompt. It should use a structured prompt builder with consistent sections.

Recommended prompt sections:


1. role and mission
2. classroom policy
3. lesson pack constraints
4. student profile guidance
5. current activity state
6. prior thread summary
7. retrieved source excerpts
8. response format instructions

### Prompt precedence

The prompt builder should enforce this order of truth:


1. classroom safety and behavior rules
2. active lesson pack and approved materials
3. current tool state and artifact data
4. student profile adjustments
5. model prior knowledge

This is critical for classroom use. The plugin must answer in alignment with the lesson, not with whatever the base model has seen online.

### Recommended teacher-configurable support modes

* `hint_only`
* `socratic`
* `evidence_first`
* `direct_explain`
* `challenge_student_thinking`

These should map to explicit prompt fragments, not hidden behavior.

## Structured Output Contract

The model should return a structured object internally, even if the student only sees the chat text.

Recommended fields:

* `student_reply`
* `teacher_rationale`
* `used_source_ids`
* `needs_human_review`
* `policy_flags`
* `suggested_followup`

This allows:

* teacher review
* research traceability
* future evals
* cleaner host app integration

Only `student_reply` needs to be shown to students in v1.

## Retrieval Strategy

V1 retrieval should stay simple and explicit.

### What to index

* lesson descriptions
* approved reading passages
* evidence library entries
* vocabulary definitions
* rubrics or criteria
* tool instructions
* teacher-authored notes for the current lesson

### Retrieval approach

V1 default:

* chunk lesson materials into moderate text passages
* index with SQLite `FTS5`
* retrieve top lexical matches by query plus lesson id filters

Optional v1.1 enhancement:

* add embeddings for semantic retrieval using the local model runtime

The retrieval pipeline should always prefer lesson-scoped material before falling back to broader classroom material.

## Memory Strategy

V1 memory should distinguish between three types of history:

### 1. Raw thread history

Keep the last several turns for local coherence.

### 2. Rolling summaries

Periodically summarize older conversation turns into a compact thread memory record.

### 3. Durable student memory

Store a small set of explicitly useful facts such as:

* recurring misconception patterns
* preferred scaffolding level
* prior unresolved questions in the same lesson or unit

Durable memory should be:

* scoped to classroom and tool
* easy to inspect
* easy to delete
* excluded from storage if a study protocol requires stricter minimization

## Data Model

V1 should begin with a relational schema roughly like this.

### Core tables

* `classrooms`
* `teacher_policies`
* `lesson_packs`
* `lesson_documents`
* `students`
* `sessions`
* `threads`
* `messages`
* `thread_summaries`
* `student_memories`
* `artifact_snapshots`
* `activity_events`
* `retrieval_chunks`
* `generation_traces`

### Suggested key fields

`classrooms`

* `id`
* `name`
* `created_at`

`teacher_policies`

* `id`
* `classroom_id`
* `mode`
* `system_guidance`
* `behavior_rules_json`
* `active_from`
* `active_to`

`lesson_packs`

* `id`
* `classroom_id`
* `title`
* `unit_name`
* `lesson_date`
* `learning_objectives_json`
* `vocabulary_json`
* `misconceptions_json`
* `success_criteria_json`
* `status`

`lesson_documents`

* `id`
* `lesson_pack_id`
* `doc_type`
* `title`
* `source_ref`
* `content`

`students`

* `id`
* `classroom_id`
* `external_student_ref`
* `grade_band`
* `reading_level`
* `profile_json`

`sessions`

* `id`
* `classroom_id`
* `lesson_pack_id`
* `student_id`
* `tool_name`
* `started_at`
* `ended_at`

`threads`

* `id`
* `session_id`
* `status`
* `created_at`

`messages`

* `id`
* `thread_id`
* `role`
* `content`
* `structured_output_json`
* `created_at`

`thread_summaries`

* `id`
* `thread_id`
* `summary`
* `covers_message_through_id`
* `created_at`

`student_memories`

* `id`
* `student_id`
* `lesson_pack_id`
* `memory_type`
* `content`
* `confidence`
* `created_at`

`artifact_snapshots`

* `id`
* `session_id`
* `artifact_type`
* `snapshot_json`
* `created_at`

`activity_events`

* `id`
* `session_id`
* `thread_id`
* `event_type`
* `payload_json`
* `created_at`

`retrieval_chunks`

* `id`
* `lesson_document_id`
* `lesson_pack_id`
* `chunk_text`
* `chunk_index`

`generation_traces`

* `id`
* `thread_id`
* `request_json`
* `response_json`
* `model_name`
* `latency_ms`
* `token_counts_json`
* `created_at`

## Security and Privacy

This system is for educational settings and research contexts, so privacy design should be deliberate from day one.

### V1 principles

* keep the model runtime local
* use pseudonymous student identifiers where possible
* avoid collecting unnecessary personal information
* store teacher-editable prompts and lesson context separately from student data
* make it easy to export or delete a student thread history
* log enough for research and review, but not more than needed

### Network posture

* AI service listens on the classroom LAN only
* model runtime listens on `localhost` only
* admin routes require a teacher credential or local secret

### Application safeguards

* sanitize host-app inputs before prompt assembly
* validate all request bodies with `Zod`
* cap snapshot and retrieval payload sizes
* separate student-visible output from internal rationale

## Performance Targets

V1 should optimize for classroom usefulness, not benchmark theater.

Suggested targets on a single reasonably modern laptop or desktop:

* support one class section with roughly `10-35` active student users
* first token latency under `4-8` seconds for a typical help request
* streamed responses under `200-300` words by default
* retrieval and prompt assembly under `500ms` for common cases

These targets imply:

* concise prompts
* compact artifact snapshots
* aggressive lesson scoping
* a small-to-medium instruction model rather than a very large local model

## Model Guidance

V1 should standardize on one primary generation model and one embedding model.

Selection criteria:

* reliable instruction following
* acceptable latency on local hardware
* competent short-form educational explanations
* stable enough for structured output

The exact model can vary by hardware, but the architecture should assume:

* one chat model
* one optional embedding model
* runtime-level model health checks

Do not let host apps select arbitrary models at request time in v1.

## Observability and Evaluation

V1 should include lightweight observability built into the app database.

Track:

* request latency
* model name
* token counts if available
* retrieval hits
* policy flags
* teacher review markers

The service should support a simple review workflow where researchers or instructors can inspect:

* the student question
* the visible response
* lesson sources used
* whether the response followed the configured mode

This is enough to support early classroom pilots and prompt iteration.

## Failure Modes and Fallback Behavior

V1 should define safe fallback behavior when local inference is unavailable.

### If the model runtime is down

* return a clear host-app error state
* log the failure
* do not fabricate partial responses

### If retrieval returns no relevant lesson material

* answer narrowly based on current tool context
* explicitly avoid unsupported claims
* optionally prompt the student to ask the teacher or inspect provided materials

### If prompt assembly exceeds token budget

* keep current artifact summary
* keep teacher policy
* keep lesson objectives and top retrieval hits
* drop older raw history in favor of thread summary

## Suggested Repository Layout

V1 repo layout:

```text
/
  README.md
  docs/
    v1-architecture.md
    api-contract.md
    data-model.md
    deployment.md
  apps/
    service/
    teacher-console/
    demo-host/
  packages/
    sdk/
    shared-types/
    prompt-builder/
    model-adapter/
```

If the project remains small initially, `apps/service` and `packages/sdk` are the highest-priority starting points.

## Implementation Phases

### Phase 1: core service

* set up Fastify service
* define shared schemas and request validation
* implement classroom, lesson pack, and student/session models
* store chat threads and stream responses
* connect to Ollama through a model adapter

### Phase 2: context-aware chat

* add event ingest
* add artifact snapshots
* implement prompt builder and retrieval from lesson documents
* add thread summaries and simple durable memory

### Phase 3: teacher operations

* add teacher-facing routes or dashboard
* enable lesson pack editing and policy controls
* add thread inspection and trace review

### Phase 4: hardening

* add eval fixtures from real classroom scenarios
* tune prompt templates
* add optional embedding-based retrieval
* test packaging for local installs

## Recommended V1 Decisions

These are the architectural decisions this document recommends for the first implementation:


1. Build a standalone local AI service with a small SDK rather than embedding logic separately into each host tool.
2. Use `Node.js`, `TypeScript`, `Fastify`, and `Zod` for the service.
3. Use `Ollama` as the default local model runtime behind an internal adapter.
4. Use `SQLite` plus `FTS5` as the default datastore and retrieval layer.
5. Treat lesson materials and teacher policy as first-class structured objects.
6. Require host apps to send structured activity events and artifact snapshots.
7. Store structured outputs and traces for review, but expose only student-facing text to students.
8. Keep v1 local-only, single-site, and intentionally modest in scope.

## Open Questions

These should be resolved before implementation begins:


1. Will the first target deployment be a developer-run local server, an Electron bundle, or both?
2. What student identifiers are acceptable under the relevant research and privacy protocols?
3. How much lesson material should teachers author directly in the plugin versus importing from the host tool?
4. For the first integration, is MEME or Net.Create the better proving ground?
5. What hardware profile should be treated as the baseline classroom server?

## Next Artifacts

The next useful design docs after this one are:


1. `api-contract.md`
2. `data-model.md`
3. `deployment.md`
4. an SDK usage example for one host app

## References

* Ollama API: <https://docs.ollama.com/api/introduction>
* Ollama tool calling: <https://docs.ollama.com/capabilities/tool-calling>
* Ollama structured outputs: <https://docs.ollama.com/capabilities/structured-outputs>
* Ollama embeddings: <https://docs.ollama.com/capabilities/embeddings>
* llama.cpp: <https://github.com/ggml-org/llama.cpp>
* SQLite FTS5: <https://www.sqlite.org/fts5.html>
* SQLite WAL: <https://sqlite.org/wal.html>
* PostgreSQL: <https://www.postgresql.org/docs/current/>
* pgvector: <https://github.com/pgvector/pgvector>


