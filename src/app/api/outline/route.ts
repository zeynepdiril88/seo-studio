import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a semantic-SEO content strategist (Koray Tuğberk Gübür framework + GEO/AEO rules).
Given a target query, you produce a COMPLETE CONTENT OUTLINE before any prose is written — the "outline first" step.

Apply every rule:
- Content Creation Framework: each outline declares Main Entity, Related Entities, User Intent, Internal Links (descriptive entity anchors, never "click here"), External References (primary sources).
- Structure: one H1 working title; H2 sections in logical order (chronological or problem→solution); H3 subsections — depth STOPS at H3.
- GEO: every H2 opens with a standalone 1-3 sentence direct answer (the "directAnswer" field); include one quotable stat per section where possible; question-mirroring H2s where natural.
- AEO: an FAQ section (question → concise answer), FAQPage-schema-ready.
- Entities named precisely (e.g. "Cortisol", not "stress hormone").
- Flag isQualityNode true only if this should be a flagship framework / ultimate-guide page.

Return STRICT JSON only (no prose, no fences), EXACTLY:
{
  "title": string,
  "mainEntity": string,
  "relatedEntities": string[],
  "userIntent": string,
  "funnelStage": "TOFU"|"MOFU"|"BOFU",
  "targetWordCount": number,
  "isQualityNode": boolean,
  "strategy": string,
  "sections": [ { "h2": string, "directAnswer": string, "keyPoints": string[], "subsections": string[], "entities": string[] } ],
  "internalLinks": [ { "anchor": string, "target": string } ],
  "externalRefs": [ { "label": string, "type": string } ],
  "faq": [ { "q": string, "a": string } ]
}
Produce 4-7 sections, 2-4 keyPoints and 0-3 subsections each; 4-8 internal links; 2-5 external refs; 4-6 FAQ items.`;

export async function POST(req: Request) {
  let query = "";
  let sourceContext = "";
  try {
    const body = await req.json();
    query = String(body.query || "").trim();
    sourceContext = String(body.sourceContext || "").trim();
    if (!query) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "Enter the query this page targets." }, { status: 400 });
  }

  try {
    const text = await generate({
      system: SYSTEM,
      temperature: 0.5,
      maxTokens: 5000,
      messages: [
        {
          role: "user",
          content: `Target query: ${query}\nSource Context: ${sourceContext || "(infer)"}\n\nReturn only the JSON outline.`,
        },
      ],
    });
    return NextResponse.json(extractJson(text));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
