/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import type { Genkit, z } from "genkit";
import type { Action } from "genkit";

/**
 * Internal registry of Genkit flows that have been declared as deployable to
 * Temporal. The Temporal Worker process imports this registry (indirectly,
 * by loading the user's flow definitions) so the generic activity can look
 * a flow up by name and execute it.
 */
const REGISTRY = new Map<string, Action<z.ZodTypeAny, z.ZodTypeAny>>();

/**
 * Register a flow under a Temporal-visible name.
 *
 * This is called by {@link defineTemporalFlow} but is also exposed for users
 * who want to register flows that were created elsewhere.
 */
export function registerTemporalFlow(
  name: string,
  flow: Action<z.ZodTypeAny, z.ZodTypeAny>,
): void {
  REGISTRY.set(name, flow);
}

/** Look up a registered flow by name. Throws if not found. */
export function getTemporalFlow(
  name: string,
): Action<z.ZodTypeAny, z.ZodTypeAny> {
  const flow = REGISTRY.get(name);
  if (!flow) {
    throw new Error(
      `[genkitx-temporal] No Genkit flow registered under name "${name}". ` +
        `Make sure your worker process imports the module that calls ` +
        `defineTemporalFlow for "${name}" before starting the Worker.`,
    );
  }
  return flow;
}

/** Returns the list of registered flow names. Useful for debugging. */
export function listRegisteredTemporalFlows(): string[] {
  return Array.from(REGISTRY.keys());
}

/** Clear the registry. Intended for tests. */
export function clearTemporalFlowRegistry(): void {
  REGISTRY.clear();
}

/**
 * Re-export for convenience so consumers don't need a direct dependency on
 * genkit types when they only want the registry.
 */
export type { Genkit };
