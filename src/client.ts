/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { Client, Connection, type WorkflowHandle } from "@temporalio/client";
import type { Action, z } from "genkit";
import { getTemporalDefaults } from "./plugin";

export interface ExecuteTemporalFlowOptions {
  address?: string;
  namespace?: string;
  taskQueue?: string;
  /**
   * Workflow ID. Defaults to `genkit-<flowName>-<random>`.
   */
  workflowId?: string;
  /**
   * Override the workflow type to invoke. Defaults to the built-in
   * `runGenkitFlow` workflow shipped by this plugin.
   */
  workflowType?: string;
  /**
   * Existing Temporal Client to reuse. When supplied, address/namespace are
   * ignored.
   */
  client?: Client;
}

/**
 * Tiny internal helper that yields a Temporal Client — either one passed in
 * by the caller or a freshly-created one targeting plugin/env defaults.
 *
 * Callers that create a client get a `close` function back to release the
 * underlying connection.
 */
async function resolveClient(options: ExecuteTemporalFlowOptions): Promise<{
  client: Client;
  close: () => Promise<void>;
}> {
  if (options.client) {
    return { client: options.client, close: async () => undefined };
  }
  const defaults = getTemporalDefaults();
  const connection = await Connection.connect({
    address: options.address ?? defaults.address,
  });
  const client = new Client({
    connection,
    namespace: options.namespace ?? defaults.namespace,
  });
  return { client, close: async () => connection.close() };
}

function flowName(flow: Action<z.ZodTypeAny, z.ZodTypeAny> | string): string {
  if (typeof flow === "string") return flow;
  // Genkit Actions expose `__action.name`.
  const anyFlow = flow as unknown as { __action?: { name?: string } };
  const name = anyFlow.__action?.name;
  if (!name) {
    throw new Error(
      "[genkitx-temporal] Could not determine flow name — pass a string instead.",
    );
  }
  return name;
}

/**
 * Start a Temporal Workflow that runs the given Genkit flow on a worker and
 * wait for its result.
 *
 * @example
 * ```ts
 * const result = await executeTemporalFlow(jokeFlow, 'cats');
 * ```
 */
export async function executeTemporalFlow<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(
  flow: Action<I, O> | string,
  input: I extends z.ZodTypeAny ? z.infer<I> : unknown,
  options: ExecuteTemporalFlowOptions = {},
): Promise<O extends z.ZodTypeAny ? z.infer<O> : unknown> {
  const defaults = getTemporalDefaults();
  const name = flowName(flow as Action<z.ZodTypeAny, z.ZodTypeAny> | string);
  const { client, close } = await resolveClient(options);
  try {
    const handle = await client.workflow.start(
      options.workflowType ?? "runGenkitFlow",
      {
        args: [{ flowName: name, input }],
        taskQueue: options.taskQueue ?? defaults.taskQueue,
        workflowId:
          options.workflowId ??
          `genkit-${name}-${Math.random().toString(36).slice(2, 10)}`,
      },
    );
    const result = (await handle.result()) as O extends z.ZodTypeAny
      ? z.infer<O>
      : unknown;
    return result;
  } finally {
    await close();
  }
}

/**
 * Lower-level helper: start a workflow without awaiting its result. Returns
 * the {@link WorkflowHandle} so the caller can signal/query/await it later.
 */
export async function startTemporalFlow<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(
  flow: Action<I, O> | string,
  input: I extends z.ZodTypeAny ? z.infer<I> : unknown,
  options: ExecuteTemporalFlowOptions = {},
): Promise<WorkflowHandle> {
  const defaults = getTemporalDefaults();
  const name = flowName(flow as Action<z.ZodTypeAny, z.ZodTypeAny> | string);
  const { client } = await resolveClient(options);
  return client.workflow.start(options.workflowType ?? "runGenkitFlow", {
    args: [{ flowName: name, input }],
    taskQueue: options.taskQueue ?? defaults.taskQueue,
    workflowId:
      options.workflowId ??
      `genkit-${name}-${Math.random().toString(36).slice(2, 10)}`,
  });
}
