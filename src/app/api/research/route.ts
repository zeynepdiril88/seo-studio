import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a semantic-SEO query researcher (Koray Tuğberk Gübür framework).
Given a Central Entity (seed), you map its full QUERY UNIVERSE — the real questions and intents behind the topic — from your own reasoning.

Group every query by query type: Definition, Problem, Solution, Comparison, Beginner.
Name entities precisely (e.g. "Cortisol", not "stress hormone").
Also include representative COMMUNITY DEMAND: how people commonly phrase this on Reddit (real pain points, "how do I…", frustrations, "is it normal that…") and on YouTube (video-style searches: "…explained", "how to…", tutorials, reviews). These are representative of those platforms from your knowledge — not scraped live data.

Return STRICT JSON only (no prose, no fences), EXACTLY:
{
  "centralEntity": string,
  "relatedEntities": string[],
  "semanticTerms": { "important": string[], "extended": string[] },
  "queryTypes": [
    { "type": "Definition"|"Problem"|"Solution"|"Comparison"|"Beginner",
      "queries": [ { "query": string, "intent": string, "funnel": "TOFU"|"MOFU"|"BOFU", "entity": string } ] }
  ],
  "communityDemand": { "reddit": string[], "youtube": string[] }
}
Include all 5 query types, 3-6 queries each; 6-12 related entities; 8-12 important + 8-12 extended terms; 4-6 reddit questions; 4-6 youtube searches.`;

export async function POST(req: Request) {
  let seed = "";
  let sourceContext = "";
  try {
    const body = await req.json();
    seed = String(body.seed || "").trim();
    sourceContext = String(body.sourceContext || "").trim();
    if (!seed) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "Enter a seed keyword / central entity." }, { status: 400 });
  }

  try {
    const text = await generate({
      system: SYSTEM,
      temperature: 0.5,
      maxTokens: 5000,
      messages: [
        {
          role: "user",
          content: `Central Entity (seed): ${seed}\nSource Context: ${sourceContext || "(infer)"}\n\nReturn only the JSON query universe.`,
        },
      ],
    });
    return NextResponse.json(extractJson(text));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
