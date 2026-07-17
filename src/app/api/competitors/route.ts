import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a competitive SEO content analyst trained on Koray Tuğberk Gübür's framework.
For the given query and market, produce a rich SERP content report on the sites that typically rank organically — from your knowledge (representative: real, well-known sites with realistic URLs and realistic content structure). Exclude pure academic databases (PMC/NCBI) from the competitor list; treat them only as source signals.

Return STRICT JSON only (no prose, no fences), EXACTLY this shape:
{
  "query": string,
  "market": string,
  "pagesAnalyzed": number,
  "competitors": [
    { "url": string, "title": string, "format": string, "wordCount": string, "sourceProfile": string, "standout": string, "weakness": string, "skeleton": string[], "sources": string[] }
  ],
  "commonSkeleton": [ { "block": string, "frequency": string, "detail": string } ],
  "keywordMap": { "core": string[], "secondary": string[], "mechanism": string[], "practice": string[], "application": string[], "questions": string[] },
  "gaps": [ { "title": string, "detail": string } ],
  "eeatGaps": [ { "title": string, "detail": string } ],
  "aiSearchGaps": [ { "title": string, "detail": string } ],
  "whatToBeat": string,
  "aiOverviewSnapshot": string
}

Rules:
- competitors: 6-10 real, well-known sites likely to rank (realistic domain URLs). format = content type (e.g. "Guide + FAQ", "5-step list", "Clinical guide", "Pillar / academic"). wordCount = approx range (e.g. "~2,300"). sourceProfile = what it cites (e.g. "9 sources: Nature, JAMA, NIH"). standout = its strongest feature. weakness = its weakest point. skeleton = its H1/H2/H3 outline (3-6 items). sources = named sources/experts/assets it uses (2-4 items).
- commonSkeleton: 5-7 shared blocks across the pages, each with a frequency like "9/10" and a one-line detail.
- keywordMap: the semantic space, clustered — core (2-3), secondary (5-8, H2-level), mechanism (science/technical terms), practice (methods/techniques), application (situational long-tail), questions (PAA / featured-snippet questions).
- gaps: 3-5 content gaps & opportunities (title + detail) — what few or none cover.
- eeatGaps: 4-6 EEAT procedures NONE of them apply (first-hand experience, author identity, update dates, primary-source links, original data, etc.).
- aiSearchGaps: 4-6 AI-search / GEO format gaps (no citable definition in first 60 words, no FAQPage schema, no comparison table, no isolated cited stat, no term glossary, no video+transcript, etc.).
- whatToBeat = the single weakest common point across them.
- aiOverviewSnapshot = how this topic is currently answered in Google's AI Overview / featured snippet.
Be specific to the topic; realistic; from your knowledge (not a live scrape).`;

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
      maxTokens: 8192,
      messages: [{ role: "user", content: `Query: ${query}\nMarket / region: ${region}\n\nReturn the full JSON competitor content report.` }],
    });
    return NextResponse.json(extractJson(text));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
