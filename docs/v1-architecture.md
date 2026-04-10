# ed-support-ai-plug V1 Architecture

## Purpose

`ed-support-ai-plug` is a reusable local AI service for classroom tools. It is intended to run on a single server computer within a classroom or lab while students access host applications from their own devices over the same local network.

The plugin is not just a chat widget. It is a context-aware service that helps learners within the boundaries of a specific lesson, activity, classroom policy, and host application state.

## Architecture Revision Note

This document reflects three additional inputs beyond the original concept:

- an initial code review of MEME at `/Users/morganavickery/Documents/GitHub/meme-2023`
- an initial code review of Net.Create at `/Users/morganavickery/Documents/GitHub/netcreate-itest`
- an initial code review of Sci Story at `/Users/morganavickery/Documents/GitHub/FoodJustice_RenPy`

Those reviews changed several architectural assumptions:

1. The plugin should be a sidecar service, not a replacement for the host app's own server, database, or realtime layer.
2. The system must support two host integration modes: adapter-based integration for legacy apps and native HTTP integration for tools that already call external services.
3. The system must support actor scopes beyond just individual students.
4. Artifact context must support multiple activity types, including maps, networks, notebooks, arguments, and narrative state.
5. Net.Create is the recommended first real integration target because its integration seams are clearer.

## V1 Goals

V1 should solve these concrete problems:

1. Provide a stable local AI service that multiple host applications can integrate with.
2. Generate learner-facing responses using lesson context, current app state, actor context, and prior conversation.
3. Allow instructors to define classroom-wide prompting, lesson materials, and guidance rules without editing code.
4. Run entirely on local hardware without depending on external cloud APIs.
5. Preserve enough traceability for research, debugging, instructional review, and early evaluation.
6. Prove that the architecture fits both an adapter-based host app and a native-client host app, not just the preview environment.

## V1 Non-Goals

V1 should explicitly avoid these concerns:

- replacing the host app's primary database
- replacing the host app's realtime transport
- agentic workflows with broad tool access
- autonomous grading or scoring
- cross-school multi-tenant hosting
- fine-tuning custom models
- real-time voice, image, or multimodal interaction
- large-scale analytics infrastructure
- sophisticated vector infrastructure beyond what is needed for local classroom retrieval

## Design Principles

The v1 architecture should follow these principles:

1. `Sidecar, not takeover`
   The AI service runs alongside the host app and consumes structured context from it.
2. `Multiple integration modes`
   The service must work both with host-specific adapters and with apps that can already call local HTTP services directly.
3. `Adapters over assumptions`
   Each host app defines its own mapping from local state to plugin events and snapshots.
4. `Lesson truth over model prior`
   Teacher policy and lesson materials outrank the base model's general knowledge.
5. `Local-first operations`
   All critical behavior should work on a single classroom machine without cloud services.
6. `Inspectable behavior`
   Prompt inputs, retrieval sources, and outputs should be traceable for research and review.

## Primary Use Cases

### MEME-like tools

Students construct concept maps or evidence maps. The AI should know:

- the current model or artifact state
- the lesson objective and approved source materials
- the evidence library and criteria for strong explanations
- the current actor identity and prior conversation

Typical support behaviors:

- ask guiding questions
- explain concepts using lesson language
- point students toward evidence already available in the tool
- help them compare competing model elements without directly completing the work for them

### Net.Create-like tools

Students enter nodes, edges, citations, and interpretations collaboratively. The AI should know:

- what the actor has already entered
- whether identity is group-based or more individual
- the coding schema and attribution rules
- the current network view and selected entities
- the lesson frame and instructor guidance for interpretation

Typical support behaviors:

- clarify coding conventions
- help users distinguish node vs edge choices
- ask for evidence or citations
- suggest checks for duplicates or ambiguity

### Sci Story-like tools

Students move through a narrative game, collect notes, build arguments, and ask characters for help or feedback. The AI should know:

- the current scene, view, or narrative location
- which characters the actor has already spoken to
- which places have been visited
- notebook contents and note types
- current draft arguments and revision history
- the active character or AI persona being invoked
- the lesson frame and teacher policy for the game session

Typical support behaviors:

- answer "what should I do next?" questions based on current game progress
- give in-character help while staying aligned to lesson goals
- provide argument or evidence feedback without writing the final response for the learner
- adapt responses based on narrative role such as helper, evaluator, or content expert

## Integration Findings

### Net.Create

Net.Create appears to be the best first integration target because:

- app logic is more explicit and centralized
- state transitions are easier to follow
- selection, node/edge changes, comments, and template changes have clearer hook points
- it already behaves like a modular application with defined message and state flows

Primary integration seams identified:

- login and session handling in `app/unisys/component/SessionShell.jsx`
- node and edge update flows in `app/view/netcreate/nc-logic.js`
- selection state in `app/view/netcreate/selection-mgr.js`
- comments in `app/view/netcreate/comment-mgr.js`
- persistence and broadcast in `app/unisys/server.js`

### MEME

MEME is also a valid integration target, but likely requires a more invasive adapter because:

- more logic is concentrated in its custom URSYS stack
- more synchronization appears to happen around database-level mutation and client sync
- fewer high-level event seams are obvious without targeted adapter work

Primary integration seams identified:

- login flow in `src/app-web/components/Login.jsx`
- session logic in `src/system/common-session.js`
- client sync layer in `src/app-web/modules/data.js`
- server mutation path in `src/system/server-database.js`
- main app views in `src/app-web/views/ViewMain`

### Sci Story

Sci Story introduces a different and important integration pattern:

- the game already builds structured AI request payloads
- the game already sends structured player logs to a service endpoint
- the game already distinguishes between multiple AI contexts such as help, knowledge, and evaluation
- the app already tracks notebook state, argument revisions, visited locations, and character interactions

Primary integration seams identified:

- service endpoints in `service/main.py`
- request and log models in `service/models.py`
- agent request assembly in `SciStoryPollinators/game/feature_scripts/eca_setup.rpy`
- structured logging in `SciStoryPollinators/game/feature_scripts/logging.rpy`
- notebook and argument events in `SciStoryPollinators/game/feature_scripts/notebook.rpy`

This repo suggests the architecture should support a `native client` mode where the host app can call the AI service directly and may not require a heavy adapter layer.

## Core Product Shape

V1 consists of five layers:

1. Host applications such as MEME or Net.Create
2. Host-specific adapters or native host clients that translate local app concepts into plugin events, snapshots, and chat calls
3. A small integration SDK used by host applications or adapters
4. A local AI service that owns context assembly, memory, retrieval, and policy
5. A local model runtime that the AI service calls for generation and embeddings

The host app should not call the model directly. The host app, adapter, or native client calls the AI service. This keeps policy, lesson retrieval, actor memory, and safety logic in one place while preserving the host app's own state and persistence architecture.

## Deployment Model

### Classroom deployment

- one teacher or server laptop runs the host application and the AI service
- students connect from their browsers over the same Wi-Fi network
- the model runtime is bound to `localhost` on the server computer
- the AI service is reachable from the LAN
- the host app and AI service may run as separate processes or under one local launcher

### Target topology

```text
Student Browser
  -> Host App UI
  -> Host App Server
     -> Host Adapter or Native Host Client
        -> ed-support-ai-plug API
           -> SQLite database
           -> lesson content index
           -> local model runtime
```

### Packaging

V1 packaging should prioritize ease of setup over perfect abstraction:

- development: `docker compose`
- deployable local server: `Node.js` process plus local model runtime
- optional later packaging: Electron shell or simple desktop installer

## Recommended Stack

### Application layer

- `Node.js`
- `TypeScript`
- `Fastify`
- `Zod`

Reasoning:

- aligns with existing Node/Electron educational tools
- straightforward for browser-based classroom apps
- easy shared typing between host apps and plugin SDK
- good performance for streaming and event ingestion

### Model runtime

Primary recommendation:

- `Ollama`

Fallback or advanced-control option:

- `llama.cpp`

Reasoning:

- both run locally on one machine
- Ollama provides a stable local HTTP API with chat, embeddings, tool calling, and structured outputs
- `llama.cpp` is useful if tighter packaging or lower-level tuning becomes important later

### Data layer

V1 default:

- `SQLite` in WAL mode
- `FTS5` for lesson and artifact text retrieval

Upgrade path:

- `PostgreSQL` plus `pgvector` if concurrency or retrieval complexity outgrows SQLite

Reasoning:

- single-file persistence is practical for one classroom server
- fewer moving parts than running Postgres in every small deployment
- adequate for pseudonymous actors and modest concurrent load
- full-text search is enough for early lesson retrieval if lesson materials are curated

Important implementation note:

- if using WAL mode, use SQLite `3.51.3` or newer because the SQLite project documents a rare WAL-reset corruption bug fixed on March 13, 2026

### Transport

- `HTTP` for CRUD and event ingest
- `Server-Sent Events` for streaming chat output
- `WebSocket` only if the host app already requires it for other collaborative state

## System Components

### 1. Host Integration Layer

The integration review shows that there are two valid host-side patterns.

#### Adapter mode

This is the right fit for tools like Net.Create and likely MEME.

Responsibilities:

- map host identity into plugin actor identity
- emit meaningful activity events
- build compact artifact snapshots
- provide selection context when the user asks for help
- decide when to start, resume, or end a plugin session

The adapter can live:

- inside the host app server
- inside the host app client
- as a thin bridge module near the host app's existing message or data layer

#### Native client mode

This is the right fit for tools like Sci Story that already call HTTP services directly.

Responsibilities:

- call the AI service directly from the host client or host service
- submit host-built context payloads without requiring a deep adapter layer
- forward structured logs and artifact-state updates
- select character- or role-specific AI behavior when the host app already models that concept

Both modes should use the same core plugin API so the service layer stays unified.

### 2. Integration SDK

This is the thin client used by host applications or adapters.

Responsibilities:

- authenticate a host app against the local AI service
- submit structured activity events
- start or resume a chat thread
- stream assistant responses
- fetch relevant lesson or teacher context when needed

Recommended surface:

- `identifySession()`
- `recordEvent()`
- `recordSnapshot()`
- `sendMessage()`
- `streamResponse()`
- `getThread()`

The SDK should stay intentionally small. It should not duplicate server-side prompt logic.

### 3. AI Service

This is the core of the system.

Responsibilities:

- authenticate requests from host apps
- store actors, sessions, threads, events, snapshots, and lesson data
- assemble context from multiple sources
- retrieve lesson materials and prior memory
- build prompts and tool definitions
- call the local model runtime
- store traces and outputs
- enforce classroom policy and response shaping

### 4. Teacher Console

V1 should expose a basic teacher-facing web interface or admin routes.

Responsibilities:

- create or edit lesson packs
- define classroom prompt defaults
- set response style and support mode
- upload lesson materials or evidence-library content
- inspect recent conversations and traces

V1 does not need a full LMS-style interface. A minimal admin dashboard is enough.

### 5. Model Runtime Adapter

This is a narrow internal abstraction over Ollama or `llama.cpp`.

Responsibilities:

- create chat completions
- request embeddings
- support structured output parsing
- expose model health and availability

This adapter keeps the rest of the system insulated from a specific runtime.

## Identity Model

The original concept assumed mostly student-scoped identity. The reviewed codebases show that this is too narrow.

V1 should use an `actor` model rather than assuming every interaction belongs to one individual student.

### Supported actor scopes

- `student`
- `group`
- `device_session`
- `teacher`

### Why this matters

Examples:

- Net.Create often behaves around group tokens and shared network work
- MEME is closer to individual tokens, but still includes classroom and group context
- some classroom contexts may require the AI to remember a thread for a group rather than a single learner

### Recommended identity fields

- `actor_id`
- `actor_scope`
- `external_ref`
- `display_name`
- `classroom_id`
- `tool_name`
- `profile_json`

Actor identity should be explicit in every plugin session.

## Context Model

The central product requirement is context assembly. V1 should treat context as structured data, not as a flat prompt blob.

### Context sources

1. classroom policy context
2. active lesson context
3. actor context
4. current activity and artifact context
5. prior conversation context

### 1. Classroom policy context

Defined by instructor or facilitator.

Examples:

- response style: hint-first, Socratic, direct explanation, evidence-first
- disallowed behaviors: do not give final answers, do not write text for the learner, do not cite outside the lesson pack
- classroom norms: encourage collaboration, ask for evidence, keep explanations age-appropriate

### 2. Active lesson context

This is the highest-priority content context.

Examples:

- lesson title
- unit and week
- learning objectives
- target vocabulary
- misconceptions to watch for
- approved lesson content
- evidence library or citations
- rubric or success criteria
- task instructions for the current activity

Prompt rule:

When lesson materials conflict with general model knowledge, the model should follow the lesson pack unless the teacher has configured otherwise.

### 3. Actor context

Examples:

- actor scope: student, group, device session, teacher
- pseudonymous actor id
- grade band or age band, when relevant
- reading level, if provided
- preferred scaffolding level
- accessibility or accommodation flags, if the research protocol permits storing them

V1 should minimize stored personal data. Prefer pseudonymous identifiers and only store information needed for instructional adaptation.

### 4. Current activity and artifact context

This is the most application-specific input.

Examples for MEME:

- current concept map nodes and links
- evidence attached to claims
- selected model element
- comment thread on the current model

Examples for Net.Create:

- current node and edge entries
- duplicate candidates
- selected graph objects
- current citation status

Examples for Sci Story:

- current location or scene label
- active character or AI persona
- notebook contents and note counts
- visited locations and spoken-to characters
- current argument draft and revision state
- recent narrative history relevant to the current interaction

The host app should send structured snapshots and events rather than forcing the AI service to scrape raw UI state.

### 5. Prior conversation context

V1 should use:

- recent raw turns from the current thread
- rolling summaries of older turns
- a lightweight memory record for durable actor preferences or recurring misconceptions

Memory should be scoped by actor, classroom, and tool. It should not become a global profile across unrelated studies or deployments.

## Host App Integration Contract

Each host app should integrate using three patterns:

1. session identification
2. event and snapshot ingestion
3. chat interaction

### 1. Session identification

The adapter should identify a plugin session using:

- `tool_name`
- `classroom_id`
- `lesson_id`
- `actor_id`
- `actor_scope`
- optional host-app session metadata

This call establishes the plugin-side context boundary for later events and chat.

### 2. Event ingestion

Host apps publish structured events to the AI service whenever the actor does something meaningful.

Examples:

- `session_started`
- `artifact_opened`
- `node_added`
- `node_updated`
- `edge_added`
- `edge_updated`
- `concept_linked`
- `evidence_attached`
- `comment_posted`
- `selection_changed`
- `view_changed`
- `submission_requested`
- `scene_changed`
- `location_changed`
- `npc_spoken_to`
- `note_added`
- `note_edited`
- `note_deleted`
- `argument_saved`
- `argument_edited`
- `ai_help_requested`
- `ai_response_received`
- `agent_error`

Each event should include:

- `event_type`
- `timestamp`
- `tool_name`
- `classroom_id`
- `lesson_id`
- `session_id`
- `actor_id`
- `actor_scope`
- `artifact_id`
- `payload`

### 3. Activity state snapshots

For retrieval and prompt assembly, host apps should periodically send compact snapshots of the current artifact state.

Examples:

- current concept map as normalized JSON
- current network coding table summary
- selected entity details
- recent evidence links
- current notebook summary
- current argument draft summary
- current narrative state and progress markers

Snapshots are more useful than reconstructing state from a long event stream on every request.

The snapshot format should be tool-specific but wrapped in a stable outer contract.

### 4. Chat interaction

When the actor sends a chat message, the host app should provide:

- the current thread id
- the actor message
- the active lesson id
- the current snapshot id or inline compact state
- optional UI selection context
- optional interaction role or character identifier

The AI service should respond as a stream plus trace metadata.

## Proposed API Surface

The API below is intentionally small. It is enough for one or more host apps to adopt the service without coupling to internal implementation.

### Teacher/admin routes

- `POST /v1/classrooms`
- `POST /v1/classrooms/:classroomId/lesson-packs`
- `PUT /v1/lesson-packs/:lessonPackId`
- `POST /v1/classrooms/:classroomId/policies`
- `GET /v1/classrooms/:classroomId/threads`
- `GET /v1/threads/:threadId`

### Host app routes

- `POST /v1/sessions/identify`
- `POST /v1/events`
- `POST /v1/artifact-snapshots`
- `POST /v1/threads`
- `POST /v1/threads/:threadId/messages`
- `GET /v1/threads/:threadId/stream`
- `GET /v1/classrooms/:classroomId/active-context`

### Health and ops routes

- `GET /health`
- `GET /health/model`
- `GET /health/db`

## Example Chat Flow

1. An actor logs into a host app using the app's own token or identity mechanism.
2. The host adapter maps that identity into a plugin actor context.
3. The host app or adapter calls `POST /v1/sessions/identify`.
4. The host app sends major activity events and periodic snapshots during the session.
5. The actor opens the chat and sends a question.
6. The host app calls `POST /v1/threads/:threadId/messages`.
7. The AI service assembles context:
   - classroom policy
   - active lesson pack
   - actor profile
   - recent events
   - latest artifact snapshot
   - prior thread summary and recent turns
   - retrieval hits from lesson materials
8. The AI service calls the model runtime.
9. Response is streamed back to the host app.
10. Final answer, structured metadata, and trace are stored.

## Prompting and Response Policy

V1 should not rely on one giant freeform system prompt. It should use a structured prompt builder with consistent sections.

Recommended prompt sections:

1. role and mission
2. classroom policy
3. lesson pack constraints
4. actor profile guidance
5. current activity state
6. prior thread summary
7. retrieved source excerpts
8. response format instructions

### Prompt precedence

The prompt builder should enforce this order of truth:

1. classroom safety and behavior rules
2. active lesson pack and approved materials
3. current tool state and artifact data
4. actor profile adjustments
5. model prior knowledge

This is critical for classroom use. The plugin must answer in alignment with the lesson, not with whatever the base model has seen online.

### Recommended teacher-configurable support modes

- `hint_only`
- `socratic`
- `evidence_first`
- `direct_explain`
- `challenge_student_thinking`

These should map to explicit prompt fragments, not hidden behavior.

## Structured Output Contract

The model should return a structured object internally, even if the learner only sees the chat text.

Recommended fields:

- `student_reply`
- `teacher_rationale`
- `used_source_ids`
- `needs_human_review`
- `policy_flags`
- `suggested_followup`

This allows:

- teacher review
- research traceability
- future evals
- cleaner host app integration

Only `student_reply` needs to be shown to learners in v1.

## Retrieval Strategy

V1 retrieval should stay simple and explicit.

### What to index

- lesson descriptions
- approved reading passages
- evidence library entries
- vocabulary definitions
- rubrics or criteria
- tool instructions
- teacher-authored notes for the current lesson

### Retrieval approach

V1 default:

- chunk lesson materials into moderate text passages
- index with SQLite `FTS5`
- retrieve top lexical matches by query plus lesson id filters

Optional v1.1 enhancement:

- add embeddings for semantic retrieval using the local model runtime

The retrieval pipeline should always prefer lesson-scoped material before falling back to broader classroom material.

## Memory Strategy

V1 memory should distinguish between three types of history:

### 1. Raw thread history

Keep the last several turns for local coherence.

### 2. Rolling summaries

Periodically summarize older conversation turns into a compact thread memory record.

### 3. Durable actor memory

Store a small set of explicitly useful facts such as:

- recurring misconception patterns
- preferred scaffolding level
- prior unresolved questions in the same lesson or unit

Durable memory should be:

- scoped to actor, classroom, and tool
- easy to inspect
- easy to delete
- excluded from storage if a study protocol requires stricter minimization

## Data Model

V1 should begin with a relational schema roughly like this.

### Core tables

- `classrooms`
- `teacher_policies`
- `lesson_packs`
- `lesson_documents`
- `actors`
- `sessions`
- `threads`
- `messages`
- `thread_summaries`
- `actor_memories`
- `artifact_snapshots`
- `activity_events`
- `retrieval_chunks`
- `generation_traces`

### Suggested key fields

`classrooms`

- `id`
- `name`
- `created_at`

`teacher_policies`

- `id`
- `classroom_id`
- `mode`
- `system_guidance`
- `behavior_rules_json`
- `active_from`
- `active_to`

`lesson_packs`

- `id`
- `classroom_id`
- `title`
- `unit_name`
- `lesson_date`
- `learning_objectives_json`
- `vocabulary_json`
- `misconceptions_json`
- `success_criteria_json`
- `status`

`lesson_documents`

- `id`
- `lesson_pack_id`
- `doc_type`
- `title`
- `source_ref`
- `content`

`actors`

- `id`
- `classroom_id`
- `tool_name`
- `actor_scope`
- `external_ref`
- `display_name`
- `grade_band`
- `reading_level`
- `profile_json`

`sessions`

- `id`
- `classroom_id`
- `lesson_pack_id`
- `actor_id`
- `tool_name`
- `started_at`
- `ended_at`

`threads`

- `id`
- `session_id`
- `status`
- `created_at`

`messages`

- `id`
- `thread_id`
- `role`
- `content`
- `structured_output_json`
- `created_at`

`thread_summaries`

- `id`
- `thread_id`
- `summary`
- `covers_message_through_id`
- `created_at`

`actor_memories`

- `id`
- `actor_id`
- `lesson_pack_id`
- `memory_type`
- `content`
- `confidence`
- `created_at`

`artifact_snapshots`

- `id`
- `session_id`
- `artifact_type`
- `snapshot_json`
- `created_at`

`activity_events`

- `id`
- `session_id`
- `thread_id`
- `event_type`
- `payload_json`
- `created_at`

`retrieval_chunks`

- `id`
- `lesson_document_id`
- `lesson_pack_id`
- `chunk_text`
- `chunk_index`

`generation_traces`

- `id`
- `thread_id`
- `request_json`
- `response_json`
- `model_name`
- `latency_ms`
- `token_counts_json`
- `created_at`

## Security and Privacy

This system is for educational settings and research contexts, so privacy design should be deliberate from day one.

### V1 principles

- keep the model runtime local
- use pseudonymous identifiers where possible
- avoid collecting unnecessary personal information
- store teacher-editable prompts and lesson context separately from actor data
- make it easy to export or delete a thread history
- log enough for research and review, but not more than needed

### Network posture

- AI service listens on the classroom LAN only
- model runtime listens on `localhost` only
- admin routes require a teacher credential or local secret

### Application safeguards

- sanitize host-app inputs before prompt assembly
- validate all request bodies with `Zod`
- cap snapshot and retrieval payload sizes
- separate learner-visible output from internal rationale

## Performance Targets

V1 should optimize for classroom usefulness, not benchmark theater.

Suggested targets on a single reasonably modern laptop or desktop:

- support one class section with roughly `10-35` active users
- first token latency under `4-8` seconds for a typical help request
- streamed responses under `200-300` words by default
- retrieval and prompt assembly under `500ms` for common cases

These targets imply:

- concise prompts
- compact artifact snapshots
- aggressive lesson scoping
- a small-to-medium instruction model rather than a very large local model

## Model Guidance

V1 should standardize on one primary generation model and one embedding model.

Selection criteria:

- reliable instruction following
- acceptable latency on local hardware
- competent short-form educational explanations
- stable enough for structured output

The exact model can vary by hardware, but the architecture should assume:

- one chat model
- one optional embedding model
- runtime-level model health checks

Do not let host apps select arbitrary models at request time in v1.

## Observability and Evaluation

V1 should include lightweight observability built into the app database.

Track:

- request latency
- model name
- token counts if available
- retrieval hits
- policy flags
- teacher review markers
- host tool name
- actor scope

The service should support a simple review workflow where researchers or instructors can inspect:

- the learner question
- the visible response
- lesson sources used
- whether the response followed the configured mode

This is enough to support early classroom pilots and prompt iteration.

## Failure Modes and Fallback Behavior

V1 should define safe fallback behavior when local inference is unavailable.

### If the model runtime is down

- return a clear host-app error state
- log the failure
- do not fabricate partial responses

### If retrieval returns no relevant lesson material

- answer narrowly based on current tool context
- explicitly avoid unsupported claims
- optionally prompt the actor to ask the teacher or inspect provided materials

### If prompt assembly exceeds token budget

- keep current artifact summary
- keep teacher policy
- keep lesson objectives and top retrieval hits
- drop older raw history in favor of thread summary

## Suggested Repository Layout

V1 repo layout:

```text
/
  README.md
  docs/
    v1-architecture.md
    development-plan.md
    api-contract.md
    data-model.md
    deployment.md
    integration-assessment-netcreate.md
  apps/
    service/
    teacher-console/
    demo-host/
  packages/
    sdk/
    shared-types/
    prompt-builder/
    model-adapter/
    adapter-netcreate/
    adapter-meme/
```

If the project remains small initially, `apps/service`, `apps/demo-host`, and a first adapter package or spike are the highest-priority starting points.

## Implementation Strategy

The reviewed host apps suggest this order of execution:

1. prove the integration contract against Net.Create
2. revise the shared type system for actor scopes and adapter-specific snapshots
3. add durable storage and repositories
4. deepen context assembly and retrieval
5. integrate Ollama
6. add teacher operations
7. harden for pilot use

## Recommended V1 Decisions

These are the architectural decisions this document recommends for the first implementation:

1. Build a standalone local AI service with host-specific adapters rather than embedding AI logic separately into each host tool.
2. Use `Node.js`, `TypeScript`, `Fastify`, and `Zod` for the service.
3. Use `Ollama` as the default local model runtime behind an internal adapter.
4. Use `SQLite` plus `FTS5` as the default datastore and retrieval layer.
5. Treat lesson materials and teacher policy as first-class structured objects.
6. Require host apps to send structured activity events and artifact snapshots through adapters.
7. Replace the original student-only identity assumption with a broader actor model.
8. Use Net.Create as the first real integration proof before broadening to MEME.
9. Store structured outputs and traces for review, but expose only learner-facing text to learners.
10. Keep v1 local-only, single-site, and intentionally modest in scope.

## Open Questions

These should be resolved before implementation begins in earnest:

1. What should the canonical actor identity rules be for group-based classroom tools?
2. What is the minimum event vocabulary needed for a first Net.Create adapter?
3. Which Net.Create workflows should be treated as the first end-to-end proof cases?
4. Which MEME workflows should be treated as the first follow-on adapter cases?
5. What hardware profile should be treated as the baseline classroom server?
6. Will the first production deployment be a developer-run local server, an Electron bundle, or both?

## Next Artifacts

The next useful design docs after this one are:

1. `development-plan.md`
2. `integration-assessment-netcreate.md`
3. `api-contract.md`
4. `data-model.md`
5. `deployment.md`

## References

- Ollama API: <https://docs.ollama.com/api/introduction>
- Ollama tool calling: <https://docs.ollama.com/capabilities/tool-calling>
- Ollama structured outputs: <https://docs.ollama.com/capabilities/structured-outputs>
- Ollama embeddings: <https://docs.ollama.com/capabilities/embeddings>
- llama.cpp: <https://github.com/ggml-org/llama.cpp>
- SQLite FTS5: <https://www.sqlite.org/fts5.html>
- SQLite WAL: <https://sqlite.org/wal.html>
- PostgreSQL: <https://www.postgresql.org/docs/current/>
- pgvector: <https://github.com/pgvector/pgvector>
