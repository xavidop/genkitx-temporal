# genkitx-temporal

> Genkit plugin that runs Genkit flows as **Temporal Workflows** — giving
> them durable execution, retries, timeouts, and visibility through the
> Temporal UI.

## Why?

Genkit flows are great for orchestrating LLMs, tools and RAG pipelines, but
they live and die with the process that invokes them. By executing the flow
*inside a Temporal Workflow*, you get:

- Automatic **retries** for transient errors (LLM 5xx, rate limits, etc.).
- **Durable history** — failures, restarts, or deploys never lose progress.
- **Timeouts, heartbeats, and cancellation** out of the box.
- A **UI** to inspect every flow execution.
- Trivial **horizontal scaling** by running more Workers.

## How it works

Temporal Workflows must be deterministic, but LLM calls are not. So the
plugin bundles a generic, deterministic workflow (`runGenkitFlow`) that
invokes a single Temporal **Activity** (`runGenkitFlowActivity`). The
activity looks up your Genkit flow by name in an in-process registry and
runs it — non-deterministic work and all.

```
┌────────────┐  start workflow   ┌──────────────────────┐
│  Client    │ ────────────────▶ │  Temporal Server     │
└────────────┘                   └─────────┬────────────┘
                                           │ task
                                           ▼
                                ┌──────────────────────┐
                                │  Worker process      │
                                │  ┌────────────────┐  │
                                │  │ runGenkitFlow  │  │  (workflow, sandboxed)
                                │  │       │        │  │
                                │  │       ▼        │  │
                                │  │ runGenkit-     │  │  (activity, full Node)
                                │  │ FlowActivity   │  │
                                │  │       │        │  │
                                │  │       ▼        │  │
                                │  │  your Genkit   │  │
                                │  │  flow (LLM…)   │  │
                                │  └────────────────┘  │
                                └──────────────────────┘
```

## Install

```sh
npm install genkitx-temporal genkit
# Temporal SDK packages are peer-installed automatically as deps of the plugin.
```

You also need a running Temporal Server. For local dev:

```sh
brew install temporal
temporal server start-dev
```

## Usage

### 1. Define a flow with `defineTemporalFlow`

```ts
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { defineTemporalFlow, temporal } from 'genkitx-temporal';

export const ai = genkit({
  plugins: [
    googleAI(),
    temporal({ taskQueue: 'my-queue' }),
  ],
  model: googleAI.model('gemini-flash-latest'),
});

export const jokeFlow = defineTemporalFlow(
  ai,
  {
    name: 'jokeFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const { text } = await ai.generate(`Tell me a joke about ${subject}`);
    return text;
  },
);
```

`defineTemporalFlow` is a drop-in replacement for `ai.defineFlow`. The
returned object is a normal Genkit flow — you can still call it directly,
expose it via the Dev UI, etc.

### 2. Start a Worker

```ts
// worker.ts
import './flows';   // <-- side-effect import: registers the flows
import { startTemporalWorker } from 'genkitx-temporal';

startTemporalWorker({ taskQueue: 'my-queue' })
  .catch((e) => { console.error(e); process.exit(1); });
```

```sh
node ./dist/worker.js
```

### 3. Execute a flow as a Temporal Workflow

```ts
// client.ts
import { executeTemporalFlow } from 'genkitx-temporal';
import { jokeFlow } from './flows';

const result = await executeTemporalFlow(jokeFlow, 'cats', {
  taskQueue: 'my-queue',
});
console.log(result);
```

`executeTemporalFlow` starts a Temporal Workflow and waits for the result.
For fire-and-forget / signalling, use `startTemporalFlow` which returns the
raw `WorkflowHandle`.

## Configuration

`temporal(options)` and every helper accept the same connection options.
Anything not passed falls back to env vars, then to sensible defaults:

| Option       | Env var               | Default          |
| ------------ | --------------------- | ---------------- |
| `address`    | `TEMPORAL_ADDRESS`    | `localhost:7233` |
| `namespace`  | `TEMPORAL_NAMESPACE`  | `default`        |
| `taskQueue`  | `TEMPORAL_TASK_QUEUE` | `genkit`         |

### Advanced: custom workflows / activities

By default the worker bundles only this package's `runGenkitFlow` workflow.
You can supply your own workflows file via the `workflowsPath` option, and
your own activities via the `activities` option:

```ts
await startTemporalWorker({
  taskQueue: 'my-queue',
  workflowsPath: require.resolve('./my-workflows'),
  activities: { ...require('./my-activities') },
});
```

Re-export the built-in activity from your activities module so the bundled
workflow keeps working:

```ts
// my-activities.ts
export { runGenkitFlowActivity } from 'genkitx-temporal/activities';
export async function myOtherActivity(...) { /* ... */ }
```

## API

- `temporal(options?)` — the Genkit plugin.
- `defineTemporalFlow(ai, config, fn)` — define a flow and register it for
  Temporal execution.
- `startTemporalWorker(options?)` — start a Worker process.
- `executeTemporalFlow(flow, input, options?)` — run a flow inside a
  Workflow and await the result.
- `startTemporalFlow(flow, input, options?)` — same but returns the
  `WorkflowHandle`.
- `runGenkitFlowActivity` — the underlying activity (re-exported so you can
  combine it with your own activities).
- `registerTemporalFlow(name, flow)` — manually register a flow that was
  defined elsewhere.

## Example test app

See [`examples/test-app`](./examples/test-app) for a complete project you
can run end-to-end against a local Temporal dev server.

## License

Apache-2.0
