# genkitx-temporal test app

A minimal end-to-end example of running Genkit flows as Temporal workflows
using the [`genkitx-temporal`](../..) plugin.

## Prerequisites

1. A running Temporal Server. The easiest way locally:
   ```sh
   brew install temporal              # macOS
   temporal server start-dev          # ships with the CLI
   ```
   The dev server listens on `localhost:7233` and exposes the Web UI at
   <http://localhost:8233>.
2. A Google AI Studio API key in `GEMINI_API_KEY` (used by the example flows).
   Copy `.env.example` to `.env` and fill it in.

## Install

```sh
cd examples/test-app
npm install
```

> The package depends on the plugin via `"genkitx-temporal": "file:.."`, so
> remember to run `npm run build` in the plugin root first (already done if
> you followed the top-level README).

## Run

Open two terminals.

**Terminal 1 — Worker:**
```sh
npm run start:worker
```
This starts a Temporal Worker that polls the `genkit-test-app` task queue and
executes any flow registered with `defineTemporalFlow`.

**Terminal 2 — Client:**
```sh
npm run start:client
```
This starts two `runGenkitFlow` workflow executions (`jokeFlow` and
`menuFlow`) and prints the results. You should also see the executions in the
Temporal Web UI.

## Optional: run flows locally (no Temporal)

```sh
npm run start:local
```

## Optional: Genkit Dev UI

```sh
npm run dev:server
```
Browse to <http://localhost:4000> to inspect / invoke the flows interactively.
