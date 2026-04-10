# ed-support-ai-plug Development Plan

This document translates the v1 architecture into a practical development sequence for the current repository.

It assumes the current state of the project is:

* monorepo scaffold exists
* service API scaffold exists
* demo host exists
* mock-model preview flow works
* MEME and Net.Create have been reviewed as candidate integration targets
* Sci Story has been reviewed as a narrative-game integration target

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

## Integration Assessment Summary

The current plan is informed by an initial review of:

* MEME at `/Users/morganavickery/Documents/GitHub/meme-2023`
* Net.Create at `/Users/morganavickery/Documents/GitHub/netcreate-itest`
* Sci Story at `/Users/morganavickery/Documents/GitHub/FoodJustice_RenPy`

The main conclusions are:


1. The plugin architecture is viable across the reviewed tools.
2. The plugin should be integrated as a `local sidecar AI service` with either a thin app-specific adapter or a native host client path.
3. Net.Create should be the first real integration target.
4. The plugin cannot assume a single identity model across tools.
5. Activity events and artifact snapshots must be tool-specific rather than generic from day one.
6. The system should support two host integration modes:
   * `adapter mode` for tools like Net.Create and likely MEME
   * `native client mode` for tools like Sci Story that already call HTTP services directly
7. The snapshot and event model must handle narrative game state in addition to maps and networks.

## Revised Planning Assumptions

The development plan should assume the following:

* the AI plugin does not replace each tool's existing database or realtime layer
* the AI plugin sits alongside the host app and consumes structured events and snapshots
* each host app needs either an adapter layer or a native client integration path
* identity may be per-student, per-group, or per-device-session depending on the host app
* the architecture should be proven against real host apps in both integration modes before deeper backend expansion
* the API contract should support both artifact-centric tools and narrative-state tools

## Why Net.Create First

Net.Create is the recommended first integration target because:

* its state and event flow are more explicit
* its app logic is more centralized around message handling and app-state transitions
* it already has clearer seams for selection, node/edge edits, comments, and template changes
* it is easier to identify concrete hook points without refactoring large parts of the app

MEME is still a valid target, but it appears to require a more invasive adapter because more logic is concentrated in its custom URSYS and database synchronization paths.

## Why Sci Story Matters

Sci Story should not replace Net.Create as the first implementation target, but it should reshape the architecture.

It demonstrates that:

* some host apps already have a service boundary and can call HTTP endpoints directly
* some host apps already build rich context payloads before the AI request
* some host apps need character-scoped or role-scoped AI behaviors
* some host apps are centered on narrative progress, notebook state, and argument revision rather than shared graph artifacts

This means the plan should validate both:

* `adapter mode` with Net.Create
* `native client mode` with Sci Story

## Development Priorities

The near-term priorities are:


1. prove the architecture against both an adapter-mode host and a native-client host
2. replace temporary in-memory persistence with local durable storage
3. make context assembly real and queryable
4. support local inference through Ollama
5. ground responses in lesson materials
6. provide teacher-facing configuration tools
7. add evaluation and reliability checks for classroom pilots

## Phase 1: Integration Contract Validation

### Goal

Validate that the plugin architecture works against real host applications in both integration modes before deepening the backend implementation.

### Recommended First Host App

* Net.Create first
* Sci Story as the first native-client reference case
* MEME second

### Deliverables

* document concrete hook points in Net.Create
* document the native-client call pattern from Sci Story
* define a Net.Create adapter contract for:
  * session identification
  * activity event emission
  * artifact snapshots
  * selection context
* define a native host contract for:
  * direct chat calls
  * host-built context payloads
  * structured log forwarding
  * role or character selection
* add a minimal host-app integration spike or mock bridge for Net.Create
* define the identity mapping strategy for:
  * student
  * group
  * device-session
* identify the minimum event vocabulary required by the plugin

### Exit Criteria

* the team can name exactly where Net.Create will call the plugin
* the team can name exactly how a native-client host such as Sci Story would call the plugin
* the event and snapshot contract is concrete enough to implement
* at least one Net.Create workflow has been mapped end to end into the plugin model
* at least one Sci Story workflow has been mapped into the same plugin model
* the plugin data model has been revised where necessary to support group-scoped sessions and narrative-state snapshots

## Phase 2: Persisted Core Service

### Goal

Replace the current in-memory prototype with a real local datastore.

### Deliverables

* SQLite schema for:
  * classrooms
  * lessons
  * actors
  * sessions
  * threads
  * messages
  * activity events
  * activity state snapshots
  * generation traces
* migration setup
* service data layer abstraction
* DB health checks

### Notes

The earlier `students` table assumption should be broadened. Based on the reviewed apps, the service should instead support an `actor` model that can represent:

* individual student
* group
* device-session alias
* teacher/facilitator

### Exit Criteria

* preview survives service restarts
* sessions, threads, snapshots, and messages reload correctly
* service routes no longer depend on in-memory state

## Phase 3: Real Context Assembly

### Goal

Make responses depend on structured classroom context rather than mostly scaffolded prompt composition.

### Deliverables

* lesson pack storage and retrieval
* query layer for recent session events and snapshots
* prompt-builder upgrade to assemble:
  * lesson context
  * teacher policy
  * actor profile
  * artifact state
  * recent activity
  * prior messages
* tool-specific context builders for:
  * Net.Create
  * Sci Story
  * MEME later
* trace storage for assembled prompt metadata

### Notes

Context assembly should not assume every host app provides the same shape of artifact state. Net.Create and MEME will need adapter-specific snapshot builders.

It also should not assume that the service always assembles all context from stored events. Sci Story suggests some hosts will submit rich context inline with the request, and the service should be able to merge host-built context with stored lesson and policy context.

### Exit Criteria

* changing lesson content measurably changes responses
* changing teacher mode measurably changes responses
* demo host can reload prior thread history after refresh or restart
* one real host-app adapter can produce usable context from live app state
* one native-client workflow can submit rich host-built context into the same service model

## Phase 4: Ollama Integration

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

## Phase 5: Retrieval

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

## Phase 6: Teacher Controls

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

## Phase 7: Evaluation And Hardening

### Goal

Make the system reliable enough for pilot classroom use.

### Deliverables

* scenario fixtures for MEME-style and Net.Create-style tasks
* scenario fixtures for Sci Story-style narrative help and argument feedback
* API integration tests
* context-assembly tests
* evaluation rubric for:
  * lesson alignment
  * age appropriateness
  * evidence use
  * refusal to over-help
* audit log review flow
* at least one host-app integration smoke test beyond the demo host

### Exit Criteria

* fixed evaluation set passes consistently
* one classroom pilot can run without manual DB edits
* failures are diagnosable from service logs and traces
* the first real host-app integration remains stable under normal classroom workflows

## Parallel Workstreams

The work can be broken into a few parallel tracks:

### Backend

* database schema
* migrations
* repositories
* routes
* trace storage
* actor/session model

### Model And Prompting

* prompt templates
* context precedence rules
* policy handling
* Ollama integration
* retrieval behavior

### Integration Adapters

* Net.Create hook implementation
* MEME hook mapping
* snapshot builders
* event emitters
* identity mapping per host app

### Native Host Integrations

* Sci Story request mapping
* host-built context payload validation
* role and character behavior configuration
* narrative-state snapshot support

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

## Host App Hook Inventory

### Net.Create

Primary hook targets identified in the repo:

* login and session handling in `app/unisys/component/SessionShell.jsx`
* node and edge creation or update flows in `app/view/netcreate/nc-logic.js`
* selection state in `app/view/netcreate/selection-mgr.js`
* comments in `app/view/netcreate/comment-mgr.js`
* network persistence and broadcast in `app/unisys/server.js`
* shared network data in `NCDATA`, `FILTEREDNCDATA`, `SELECTION`, and `TEMPLATE`

This is the first recommended adapter target.

### Sci Story

Primary integration targets identified in the repo:

* service endpoints in `service/main.py`
* request and log models in `service/models.py`
* agent request assembly in `SciStoryPollinators/game/feature_scripts/eca_setup.rpy`
* structured logging in `SciStoryPollinators/game/feature_scripts/logging.rpy`
* notebook and argument events in `SciStoryPollinators/game/feature_scripts/notebook.rpy`
* narrative progress state in scene labels, location changes, visited lists, spoken lists, and argument attempts

This is the first recommended native-client reference target.

### MEME

Primary hook targets identified in the repo:

* login flow in `src/app-web/components/Login.jsx`
* session logic in `src/system/common-session.js`
* client sync layer in `src/app-web/modules/data.js`
* server mutation path in `src/system/server-database.js`
* app shell and primary views in `src/app-web/views/ViewMain`
* model and evidence data in `models`, `pmcData`, comments, and linked resources

This is the second recommended adapter target after Net.Create.

## Suggested Next Two Weeks

The most useful short-term sequence is:


1. write a Net.Create integration assessment with exact hook points and event vocabulary
2. write a Sci Story integration assessment with request, event, and snapshot mapping
3. revise shared types to support actor scopes beyond just student
4. define adapter interfaces for:
   * identify session
   * record event
   * build snapshot
   * send selection context
5. define native-host interfaces for:
   * identify session
   * submit inline context
   * record event
   * send role-aware chat requests
6. add SQLite and migrations
7. refactor the service store behind a repository layer
8. add a first integration test for:
   * bootstrap
   * snapshot
   * message
   * host-app adapter mapping

## Definition Of Done For V1

V1 should mean:

* local-only deployment on one classroom machine
* reusable service API and SDK
* at least one proven adapter-mode integration
* at least one proven native-client integration path
* lesson-aware and context-aware chat
* teacher-configurable classroom policy and lesson materials
* durable conversation history and artifact context
* browser-based preview/demo host for testing
* documented setup and pilot workflow

## Recommended Ticket Order

The first implementation backlog should be tackled in this order:


1. Net.Create integration contract and hook inventory
2. Sci Story native-client contract and event vocabulary
3. actor and session model revision in shared types
4. snapshot model revision to support both artifact and narrative state
5. SQLite schema and migrations
6. persistent repositories in `apps/service`
7. seed and fixture loader
8. retrieval indexing
9. Ollama-first response path
10. teacher/admin CRUD
11. evaluation harness

## Notes

* the current preview app is useful enough to support iterative backend work
* the mock provider should remain available even after Ollama integration
* retrieval should start with lesson-scoped lexical search before adding embeddings
* a safe and inspectable teacher-facing workflow matters as much as the model output itself
* Net.Create appears to offer the cleanest first proof that the plugin architecture fits a real classroom tool
* Sci Story is the clearest proof that the plugin also needs a direct native-client integration path
* MEME remains important, but its integration should happen after the adapter model is proven
