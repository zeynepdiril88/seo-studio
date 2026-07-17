import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a competitive SEO analyst. For the given query and region, produce a competitor content analysis based on your knowledge of the sites that typically rank organically for this topic.

Return STRICT JSON only (no prose, no fences), EXACTLY:
{
  "query": string,
  "competitors": [ { "url": string, "title": string, "covers": string, "strength": string, "weakness": string } ],
  "commonSkeleton": string[],
  "gaps": { "coverage": string[], "depth": string[], "experience": string[] },
  "whatToBeat": string,
  "aiOverviewSnapshot": string
}

Rules:
- List up to 10 well-known, REAL sites/brands that realistically rank for this topic (e.g. Healthline, Calm, Verywell, authoritative .edu/.org). Use realistic domain URLs (best-known, not fabricated deep links).
- commonSkeleton = the shared H2 sections most ranking pages use.
- gaps: coverage (topics/entities none cover), depth (where they stay shallow), experience (frameworks / exercises / templates / original data they lack).
- whatToBeat = the single weakest common point.
- aiOverviewSnapshot = how this topic is typically answered in Google's AI Overview / featured snippet.
- These are representative from your knowledge (not a live SERP scrape); be realistic and specific to the topic.`;

export async function POST(req: Request) {
  let query = "";
  let region = "United States";
  try {
    const body = await req.json();
    query = String(body.query || body.seed || "").trim();
    if (body.region) region = String(body.region).trim();
    if (!query) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "Enter a keyword / query to analyze competitors for." }, { status: 400 });
  }

  try {
    const text = await generate({
      system: SYSTEM,
      temperature: 0.5,
      maxTokens: 6000,
      think: true,
      messages: [{ role: "user", content: `Query: ${query}\nRegion: ${region}\n\nReturn the JSON competitor analysis.` }],
    });
    return NextResponse.json(extractJson(text));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
