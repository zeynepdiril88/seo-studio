import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a competitive SEO analyst. Use Google Search to find the CURRENT top organic (non-advertisement) ranking pages on Google for the given query and region. Read what each covers, then produce a competitive gap analysis.

Return a JSON object (you may add brief text around it, but the JSON must be present and valid), EXACTLY this shape:
{
  "query": string,
  "competitors": [ { "url": string, "title": string, "covers": string, "strength": string, "weakness": string } ],
  "commonSkeleton": string[],
  "gaps": { "coverage": string[], "depth": string[], "experience": string[] },
  "whatToBeat": string,
  "aiOverviewSnapshot": string
}

Rules:
- Use REAL URLs and titles from your Google Search results — organic results only, exclude ads.
- Up to 10 competitors, ordered by ranking.
- commonSkeleton = the shared H2 sections most of them use.
- gaps: coverage (topics/entities none of them cover), depth (where they stay shallow and you could go deeper), experience (frameworks / exercises / templates / original data they lack).
- whatToBeat = the single weakest common point across them.
- aiOverviewSnapshot = how this topic is currently answered in Google's AI Overview / featured snippet, so we target being the cited source.`;

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
      temperature: 0.4,
      maxTokens: 8192,
      think: true,
      json: false,
      search: true,
      messages: [{ role: "user", content: `Query: ${query}\nRegion: ${region}\n\nFind the top organic competitors and return the JSON.` }],
    });
    return NextResponse.json(extractJson(text));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
