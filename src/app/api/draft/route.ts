import { NextResponse } from "next/server";
import { generate } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are an expert SEO + GEO content writer (Koray Tuğberk Gübür semantic framework).
Given a content OUTLINE (as JSON), write the FULL article in clean Markdown, following the outline exactly.

Rules:
- Start with the H1 title (# Title).
- For every H2 section: open with a 1-3 sentence DIRECT ANSWER (GEO — the standalone answer to that section's question), then the body.
- Use the H3 subsections where given. Cover the main entity and weave in the related entities naturally and precisely.
- Insert the internal links as Markdown links using the given descriptive anchor text → its target (e.g. [nervous system regulation techniques](/target)). Never "click here".
- Cite the external references where relevant.
- Include one quotable, specific statistic or factual sentence per section where natural (AI-citable).
- EEAT — weave through the prose, never a bolted-on section:
  · Experience — write from concrete, first-hand framing where the topic allows ("In practice…", "When applied…", observed results). Be specific, not abstract. Never fabricate personal identity claims.
  · Expertise — use precise, correct terminology and explain mechanisms, not just outcomes; carry the authority of the outline's author angle in the tone.
  · Authoritativeness — feature the outline's original asset (original data, a named framework / methodology, or a distinct point of view) so this reads as the source others would cite, not a recap.
  · Trustworthiness — attribute concrete claims to a primary source inline (study, official body, named expert). FAQ answers must be sourced too, not generic.
- End with a "## FAQ" section: each question as a bolded line, then a concise answer (FAQPage-ready).
- After the FAQ, add a one-line author / expertise note reflecting the outline's author angle (if any), then an italic "*Last updated: {DATE}*" line using the date provided in the prompt.
- Publication-ready grammar and style. Confident, clear, declarative sentences. Write in English.

Return ONLY the Markdown article — no JSON, no code fences, no preamble. The only closing content is the author note and the Last updated line.`;

export async function POST(req: Request) {
  let outline: unknown = null;
  let query = "";
  let instructions = "";
  try {
    const body = await req.json();
    outline = body.outline ?? null;
    query = String(body.query || "").trim();
    instructions = String(body.instructions || "").trim().slice(0, 1200);
    if (!outline && !query) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "Generate an outline first, then write the draft." }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const content =
    (outline
      ? `Write the full article from this outline:\n\n${JSON.stringify(outline)}`
      : `Write a full, GEO-optimized article targeting the query: ${query}`) +
    (instructions
      ? `\n\nADDITIONAL INSTRUCTIONS FROM THE USER — follow these exactly; they override the defaults (e.g. word count, tone, structure, a specific H1/H2) wherever they conflict:\n${instructions}`
      : "") +
    `\n\nToday's date (use for the Last updated line): ${today}`;

  try {
    const markdown = await generate({
      system: SYSTEM,
      temperature: 0.6,
      maxTokens: 8192,
      json: false,
      messages: [{ role: "user", content }],
    });
    return NextResponse.json({ markdown });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
