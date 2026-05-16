/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { getTemporalFlow } from "./registry";

/**
 * Generic Temporal Activity that runs a previously-registered Genkit flow by
 * name and returns its output. The flow body executes inside the Activity
 * worker (NOT the Workflow sandbox), so it may freely make non-deterministic
 * calls such as LLM requests, HTTP fetches, DB queries, etc.
 */
export async function runGenkitFlowActivity(input: {
  flowName: string;
  /**
   * JSON-serializable input forwarded to the flow. The flow's own zod
   * schema (if any) validates it.
   */
  input: unknown;
}): Promise<unknown> {
  const flow = getTemporalFlow(input.flowName);
  // Genkit Actions are callable directly with their input.
  return await (flow as unknown as (i: unknown) => Promise<unknown>)(
    input.input,
  );
}

/**
 * Convenience export object — pass this to `Worker.create({ activities })`.
 */
export const activities = {
  runGenkitFlowActivity,
};
