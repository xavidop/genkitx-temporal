/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import {
  NativeConnection,
  Worker,
  type WorkerOptions,
} from "@temporalio/worker";
import { activities as defaultActivities } from "./activities";
import { getTemporalDefaults } from "./plugin";

export interface StartTemporalWorkerOptions {
  /** host:port of the Temporal Server. Defaults to plugin/env defaults. */
  address?: string;
  /** Temporal namespace. Defaults to plugin/env defaults. */
  namespace?: string;
  /** Task queue this worker polls. Defaults to plugin/env defaults. */
  taskQueue?: string;
  /**
   * Path to the workflows module. Defaults to the workflows bundled by this
   * package (`require.resolve('genkitx-temporal/workflows')`).
   *
   * Override this if you want to ship your own Workflow definitions in
   * addition to the generic `runGenkitFlow` workflow.
   */
  workflowsPath?: string;
  /**
   * Additional activities to register alongside the built-in
   * `runGenkitFlowActivity`.
   */
  activities?: Record<string, (...args: unknown[]) => unknown>;
  /** Escape hatch for any other WorkerOptions field. */
  workerOptions?: Partial<WorkerOptions>;
}

/**
 * Creates and starts a Temporal Worker that can execute any Genkit flow
 * registered with {@link defineTemporalFlow}.
 *
 * IMPORTANT: the entry-point that calls this function MUST first import
 * (transitively) every module that registers flows. Otherwise the activity
 * will fail with "No Genkit flow registered under name ..." at runtime.
 *
 * @returns the running {@link Worker}. The promise resolves when the worker
 * shuts down (e.g. on SIGINT) — usually you'll just `await` it from your
 * worker entry-point.
 */
export async function startTemporalWorker(
  options: StartTemporalWorkerOptions = {},
): Promise<void> {
  const defaults = getTemporalDefaults();
  const address = options.address ?? defaults.address;
  const namespace = options.namespace ?? defaults.namespace;
  const taskQueue = options.taskQueue ?? defaults.taskQueue;
  const workflowsPath =
    options.workflowsPath ?? require.resolve("./workflows");

  const connection = await NativeConnection.connect({ address });

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    workflowsPath,
    activities: {
      ...defaultActivities,
      ...(options.activities ?? {}),
    },
    ...(options.workerOptions ?? {}),
  });

  try {
    await worker.run();
  } finally {
    await connection.close();
  }
}
