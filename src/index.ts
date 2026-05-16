/**
 * Copyright 2026 Xavier Portilla Edo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

export {
  temporal,
  getTemporalDefaults,
  type TemporalPluginOptions,
} from "./plugin";

export { defineTemporalFlow, type TemporalFlowConfig } from "./flow";

export {
  registerTemporalFlow,
  getTemporalFlow,
  listRegisteredTemporalFlows,
  clearTemporalFlowRegistry,
} from "./registry";

export {
  startTemporalWorker,
  type StartTemporalWorkerOptions,
} from "./worker";

export {
  executeTemporalFlow,
  startTemporalFlow,
  type ExecuteTemporalFlowOptions,
} from "./client";

export { runGenkitFlowActivity, activities } from "./activities";

import { temporal } from "./plugin";
export default temporal;
