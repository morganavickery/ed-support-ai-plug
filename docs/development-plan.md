# ed-support-ai-plug Development Plan

This document translates the v1 architecture into a practical development sequence for the current repository.

It assumes the current state of the project is:

* monorepo scaffold exists
* service API scaffold exists
* demo host exists
* mock-model preview flow works

In other words, this plan starts from the current prototype and focuses on moving it toward a usable v1 for classroom pilots.

## Current Baseline

The repo currently includes:

* a local service scaffold in `apps/service`
* a browser-based preview app in `apps/demo-host`
* shared schemas in `packages/shared-types`
* an SDK in `packages/sdk`
* prompt-builder and model-adapter packages
* a working preview flow using the mock provider

This should be treated as `Phase 0 complete`.

## Development Priorities

The near-term priorities are:


1. replace temporary in-memory persistence with local durable storage
2. make context assembly real and queryable
3. support local inference through Ollama
4. ground responses in lesson materials
5. provide teacher-facing configuration tools
6. add evaluation and reliability checks for classroom pilots

## Phase 1: Persisted Core Service

### Goal

Replace the current in-memory prototype with a real local datastore.

### Deliverables

* SQLite schema for:
  * classrooms
  * lessons
  * students
  * sessions
  * threads
  * messages
  * activity events
  * artifact snapshots
  * generation traces
* migration setup
* service data layer abstraction
* DB health checks

### Exit Criteria

* preview survives service restarts
* sessions, threads, snapshots, and messages reload correctly
* service routes no longer depend on in-memory state

## Phase 2: Real Context Assembly

### Goal

Make responses depend on structured classroom context rather than mostly scaffolded prompt composition.

### Deliverables

* lesson pack storage and retrieval
* query layer for recent session events and snapshots
* prompt-builder upgrade to assemble:
  * lesson context
  * teacher policy
  * student profile
  * artifact state
  * recent activity
  * prior messages
* trace storage for assembled prompt metadata

### Exit Criteria

* changing lesson content measurably changes responses
* changing teacher mode measurably changes responses
* demo host can reload prior thread history after refresh or restart

## Phase 3: Ollama Integration

### Goal

Replace the mock path with real local inference while keeping the mock adapter for development and tests.

### Deliverables

* Ollama configuration instructions
* clearer model health diagnostics
* timeout and retry handling
* safer structured response parsing
* fallback behavior when the model is unavailable

### Exit Criteria

* preview works with `MODEL_PROVIDER=ollama`
* service returns safe errors when the local model runtime is down
* model health route gives actionable diagnostics

## Phase 4: Retrieval

### Goal

Ground responses in lesson materials and teacher-provided content.

### Deliverables

* lesson document ingestion
* chunking pipeline
* SQLite `FTS5` indexing
* retrieval service filtered by classroom and lesson
* assistant metadata includes source identifiers

### Exit Criteria

* preview responses can be traced to lesson material
* off-lesson questions produce narrower responses
* retrieval results are visible in traces or debug metadata

## Phase 5: Teacher Controls

### Goal

Allow facilitators to configure classroom behavior without manual JSON editing.

### Deliverables

* basic teacher/admin routes
* simple teacher console UI for:
  * classroom policy
  * lesson packs
  * uploaded lesson documents
  * thread inspection
* support-mode controls:
  * `hint_only`
  * `socratic`
  * `evidence_first`
  * `direct_explain`
  * `challenge_student_thinking`

### Exit Criteria

* a facilitator can configure a lesson from the UI
* new sessions reflect updated policy and lesson settings
* teacher-authored lesson data no longer requires direct file edits

## Phase 6: Evaluation And Hardening

### Goal

Make the system reliable enough for pilot classroom use.

### Deliverables

* scenario fixtures for MEME-style and Net.Create-style tasks
* API integration tests
* context-assembly tests
* evaluation rubric for:
  * lesson alignment
  * age appropriateness
  * evidence use
  * refusal to over-help
* audit log review flow

### Exit Criteria

* fixed evaluation set passes consistently
* one classroom pilot can run without manual DB edits
* failures are diagnosable from service logs and traces

## Parallel Workstreams

The work can be broken into a few parallel tracks:

### Backend

* database schema
* migrations
* repositories
* routes
* trace storage

### Model And Prompting

* prompt templates
* context precedence rules
* policy handling
* Ollama integration
* retrieval behavior

### Preview UX

* demo-host improvements
* scenario loading
* thread reload behavior
* clearer preview diagnostics

### Research Operations

* classroom scenarios
* teacher workflows
* evaluation rubric
* pilot readiness checklist

### Deployment

* local install instructions
* Node/Ollama setup flow
* backup/export strategy
* classroom machine requirements

## Suggested Next Two Weeks

The most useful short-term sequence is:


1. add SQLite and migrations
2. refactor the service store behind a repository layer
3. persist threads, messages, events, and snapshots
4. add seed data support for lesson packs
5. improve the demo host so it can reload prior sessions
6. add a first integration test for:
   * bootstrap
   * snapshot
   * message

## Definition Of Done For V1

V1 should mean:

* local-only deployment on one classroom machine
* reusable service API and SDK
* lesson-aware and context-aware chat
* teacher-configurable classroom policy and lesson materials
* durable conversation history and artifact context
* browser-based preview/demo host for testing
* documented setup and pilot workflow

## Recommended Ticket Order

The first implementation backlog should be tackled in this order:


1. SQLite schema and migrations
2. persistent repositories in `apps/service`
3. seed and fixture loader
4. retrieval indexing
5. Ollama-first response path
6. teacher/admin CRUD
7. evaluation harness

## Notes

* the current preview app is useful enough to support iterative backend work
* the mock provider should remain available even after Ollama integration
* retrieval should start with lesson-scoped lexical search before adding embeddings
* a safe and inspectable teacher-facing workflow matters as much as the model output itself


