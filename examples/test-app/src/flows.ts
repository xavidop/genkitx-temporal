/**
 * Genkit setup + flow definitions shared by the worker and local runner.
 *
 * Each flow is declared via `defineTemporalFlow` so it is both:
 *   1. A normal Genkit flow (callable in-process / via the dev UI), and
 *   2. Registered for execution inside a Temporal Workflow.
 */

import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { defineTemporalFlow, temporal } from "genkitx-temporal";

export const ai = genkit({
  plugins: [
    googleAI(),
    temporal({
      // address: 'localhost:7233',  // optional — defaults shown
      // namespace: 'default',
      taskQueue: "genkit-test-app",
    }),
  ],
  model: googleAI.model("gemini-flash-latest"),
});

/**
 * Trivial flow: ask the LLM for a joke about the given subject.
 * Run it from the client with:
 *   await executeTemporalFlow(jokeFlow, 'cats');
 */
export const jokeFlow = defineTemporalFlow(
  ai,
  {
    name: "jokeFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const { text } = await ai.generate(`Tell me a short joke about ${subject}.`);
    return text;
  },
);

/**
 * Slightly richer flow: structured input + output.
 */
export const menuFlow = defineTemporalFlow(
  ai,
  {
    name: "menuFlow",
    inputSchema: z.object({
      cuisine: z.string(),
      vegetarian: z.boolean().optional(),
    }),
    outputSchema: z.object({
      dish: z.string(),
      description: z.string(),
    }),
  },
  async ({ cuisine, vegetarian }) => {
    const { output } = await ai.generate({
      prompt: `Suggest a${vegetarian ? " vegetarian" : ""} dish for a ${cuisine} restaurant. Reply as JSON with "dish" and "description".`,
      output: {
        schema: z.object({
          dish: z.string(),
          description: z.string(),
        }),
      },
    });
    if (!output) throw new Error("No output from the model.");
    return output;
  },
);
