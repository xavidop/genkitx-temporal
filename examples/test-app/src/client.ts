/**
 * Temporal Client entry-point. Run this in another terminal while the worker
 * is running:
 *
 *   npm run start:client
 *
 * It triggers a `runGenkitFlow` workflow execution for each example flow and
 * prints the result.
 */

import "dotenv/config";
import { executeTemporalFlow } from "genkitx-temporal";
// We import the flow objects only for nice type-safe call sites; the flow
// body itself is NOT executed in this process — it runs on the worker.
import { jokeFlow, menuFlow } from "./flows";

async function main() {
  console.log("[client] invoking jokeFlow via Temporal...");
  const joke = await executeTemporalFlow(jokeFlow, "cats", {
    taskQueue: "genkit-test-app",
  });
  console.log("[client] joke:", joke);

  console.log("[client] invoking menuFlow via Temporal...");
  const menu = await executeTemporalFlow(
    menuFlow,
    { cuisine: "Japanese", vegetarian: true },
    { taskQueue: "genkit-test-app" },
  );
  console.log("[client] menu:", menu);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[client] fatal:", err);
    process.exit(1);
  });
