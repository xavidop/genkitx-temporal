/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { genkitPlugin } from "genkit/plugin";

/**
 * Options for the Temporal Genkit plugin.
 *
 * Note: these are *defaults* used when no explicit value is supplied to the
 * worker or client helpers. They do not configure the Temporal Server itself.
 */
export interface TemporalPluginOptions {
  /**
   * Default Temporal address (host:port) used by the helpers when none is
   * passed explicitly. Defaults to the env var `TEMPORAL_ADDRESS` or
   * `localhost:7233`.
   */
  address?: string;

  /**
   * Default Temporal namespace. Defaults to env `TEMPORAL_NAMESPACE` or
   * `"default"`.
   */
  namespace?: string;

  /**
   * Default task queue used when none is passed explicitly. Defaults to env
   * `TEMPORAL_TASK_QUEUE` or `"genkit"`.
   */
  taskQueue?: string;
}

let _options: Required<TemporalPluginOptions> | undefined;

/**
 * Returns the resolved defaults — initialized either by the plugin or by env
 * vars if the plugin wasn't installed.
 */
export function getTemporalDefaults(): Required<TemporalPluginOptions> {
  if (_options) return _options;
  _options = {
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
    namespace: process.env.TEMPORAL_NAMESPACE || "default",
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || "genkit",
  };
  return _options;
}

/**
 * The Genkit plugin. Registers no models or embedders — it exists primarily
 * to surface the integration in `genkit({ plugins: [...] })` and to capture
 * shared defaults for the worker / client helpers.
 *
 * @example
 * ```ts
 * const ai = genkit({ plugins: [temporal({ taskQueue: 'my-queue' })] });
 * ```
 */
export const temporal = (options: TemporalPluginOptions = {}) =>
  genkitPlugin("temporal", async () => {
    _options = {
      address: options.address || process.env.TEMPORAL_ADDRESS || "localhost:7233",
      namespace:
        options.namespace || process.env.TEMPORAL_NAMESPACE || "default",
      taskQueue:
        options.taskQueue || process.env.TEMPORAL_TASK_QUEUE || "genkit",
    };
  });

export default temporal;
