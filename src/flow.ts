/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import type { Genkit, z, Action } from "genkit";
import { registerTemporalFlow } from "./registry";

/**
 * Configuration for {@link defineTemporalFlow}. Mirrors the shape Genkit
 * itself accepts for `defineFlow`, with an optional `name` override used as
 * the Temporal workflow lookup key (defaults to the flow name).
 */
export interface TemporalFlowConfig<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {
  name: string;
  inputSchema?: I;
  outputSchema?: O;
  /**
   * Override the name used in Temporal's flow registry. Defaults to `name`.
   */
  temporalName?: string;
}

/**
 * Defines a Genkit flow and registers it so it can be executed inside a
 * Temporal Workflow.
 *
 * The returned value is a normal Genkit flow — callable locally with
 * `await flow(input)` — but it is *also* available to the bundled Temporal
 * Workflow defined in `genkitx-temporal/workflows` via the activity layer.
 *
 * @example
 * ```ts
 * export const jokeFlow = defineTemporalFlow(
 *   ai,
 *   {
 *     name: 'jokeFlow',
 *     inputSchema: z.string(),
 *     outputSchema: z.string(),
 *   },
 *   async (subject) => {
 *     const { text } = await ai.generate(`Tell me a joke about ${subject}`);
 *     return text;
 *   },
 * );
 * ```
 */
export function defineTemporalFlow<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(
  ai: Genkit,
  config: TemporalFlowConfig<I, O>,
  fn: (input: z.infer<I>) => Promise<z.infer<O>>,
): Action<I, O> {
  const flow = ai.defineFlow(
    {
      name: config.name,
      inputSchema: config.inputSchema as I,
      outputSchema: config.outputSchema as O,
    },
    fn,
  ) as unknown as Action<I, O>;

  registerTemporalFlow(
    config.temporalName ?? config.name,
    flow as unknown as Action<z.ZodTypeAny, z.ZodTypeAny>,
  );

  return flow;
}
