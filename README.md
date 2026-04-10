# ed-support-ai-plug

a plug-and-play add-on for educational technology developers for lightweight, locally-run ai-integration into boutique apps

## Docs

* [V1 architecture](./docs/v1-architecture.md)

## Repo Scaffold

The repo now includes a minimal TypeScript workspace aligned to the v1 architecture:

```text
apps/
  service/            Fastify API for sessions, threads, events, snapshots, and chat
  demo-host/          Browser-based preview app that simulates a host tool
packages/
  shared-types/       Zod schemas and shared API/data contracts
  prompt-builder/     Structured prompt composition
  model-adapter/      Mock and Ollama model adapters
  sdk/                Host-app client for calling the service
```

The service is wired to a `mock` model provider by default so the API can be exercised before a local LLM runtime is installed.

## Getting Started

This workspace requires `Node.js >=20`.

1. Install dependencies:

   ```bash
   nvm use || nvm install
   npm install
   ```
2. Build the workspace:

   ```bash
   npm run build
   ```
3. Start the local service:

   ```bash
   npm run dev:service
   ```
4. Check health:

   ```bash
   curl http://localhost:3031/health
   ```

## Preview In The Browser

Run the service and demo host together:

```bash
npm run dev:preview
```

Then open:

- service: `http://localhost:3031/health`
- demo host: `http://localhost:3032`

The demo host lets you:

- load MEME and Net.Create style presets
- create a session and thread
- record artifact snapshots and activity events
- chat against the live local AI service
- inspect the assistant reply plus teacher-facing metadata

## Environment

The service supports these environment variables:

* `HOST` default `0.0.0.0`
* `PORT` default `3031`
* `MODEL_PROVIDER` default `mock`, optional `ollama`
* `OLLAMA_BASE_URL` default `http://127.0.0.1:11434/api`
* `OLLAMA_MODEL` default `gemma3:4b`

To switch to Ollama later:

```bash
MODEL_PROVIDER=ollama OLLAMA_MODEL=gemma3:4b npm run dev:service
```

The demo host supports:

- `DEMO_HOST_HOST` default `0.0.0.0`
- `DEMO_HOST_PORT` default `3032`
- `DEMO_SERVICE_BASE_URL` default `http://127.0.0.1:3031`

## Immediate Next Steps

* add persistent storage in the service instead of the in-memory store
* flesh out the teacher/admin routes
* add streaming responses and richer trace storage
* add a persistent scenario library and seeded fixtures for classroom test cases
