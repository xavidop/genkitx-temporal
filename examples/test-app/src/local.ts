/**
 * Convenience script that calls the flows directly, bypassing Temporal.
 * Useful for sanity-checking your Genkit setup before involving Temporal.
 *
 *   npm run start:local
 */

import "dotenv/config";
import { jokeFlow, menuFlow } from "./flows";

async function main() {
  console.log("joke:", await jokeFlow("cats"));
  console.log(
    "menu:",
    await menuFlow({ cuisine: "Italian", vegetarian: false }),
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
