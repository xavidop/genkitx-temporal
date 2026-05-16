/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * --------------------------------------------------------------------------
 *
 * This module is intentionally restricted: it is loaded by the Temporal
 * Workflow sandbox via the bundler. It MUST NOT import anything that
 * performs side effects, I/O, or that pulls in `genkit` / Node built-ins
 * outside of `@temporalio/workflow`.
 */

import { proxyActivities } from "@temporalio/workflow";

interface Activities {
  runGenkitFlowActivity(input: {
    flowName: string;
    input: unknown;
  }): Promise<unknown>;
}

const { runGenkitFlowActivity } = proxyActivities<Activities>({
  // Long-ish default for LLM calls; users may override on the client side
  // with workflow-level retry / per-activity options if needed.
  startToCloseTimeout: "10 minutes",
});

/**
 * Generic workflow that executes a named Genkit flow registered in the
 * Worker's process. This is the entry-point used by
 * {@link executeFlowWorkflow}.
 */
export async function runGenkitFlow(args: {
  flowName: string;
  input: unknown;
}): Promise<unknown> {
  return await runGenkitFlowActivity(args);
}
