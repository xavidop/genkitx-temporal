/**
 * Temporal Worker entry-point. Run this in one terminal:
 *
 *   npm run start:worker
 *
 * It connects to the Temporal Server (default `localhost:7233`), polls the
 * `genkit-test-app` task queue, and executes any flow registered via
 * `defineTemporalFlow`.
 */

import "dotenv/config";
// IMPORTANT: importing this module side-effect-registers every flow.
import "./flows";
import { startTemporalWorker } from "genkitx-temporal";

async function main() {
  console.log("[worker] starting Temporal worker for task queue 'genkit-test-app'...");
  await startTemporalWorker({
    taskQueue: "genkit-test-app",
  });
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
