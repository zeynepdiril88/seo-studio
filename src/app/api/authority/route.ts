import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a semantic-SEO strategist trained on Koray Tuğberk Gübür's Topical Authority framework.
Given a Central Entity (seed) and optional Source Context, you design a full topical map — a KNOWLEDGE ARCHITECTURE, not a keyword list.

You may also receive:
- SITE CONTENT: the user's own site. Use it to judge what they ALREADY cover. Mark each support node "covered": true if the site already addresses it, false if it is a GAP (missing).
- SOURCES: the user's own material (e.g. their book, notes). Ground the map — especially the gap-filling — in these: use their concepts, terminology and entities. Always COMPLETE the map by adding the missing nodes so coverage becomes comprehensive.

Rules:
- Central Search Intent = Source Context + Central Entity unified.
- TAXONOMY: specific-concept hierarchy. Pillars = macro-contexts; Clusters = subtopics; Support = long-tail queries. NEVER generic buckets ("Tips","Blog","Health").
- Every support node is a real QUERY, tagged queryType (Definition/Problem/Solution/Comparison/Beginner) and covered (boolean).
- ONTOLOGY: relationships — relation ∈ affects, regulated-through, part-of, connected-with, causes, measured-by.
- GAPS: coverage (missing topics), depth (go deeper), experience (frameworks/exercises/original methodology).
- INTERNAL LINKS: support → cluster → pillar; anchor = descriptive entity phrase, never "click here".
- QUALITY NODES: 1-3 flagship framework pages.
- RESEARCH SUGGESTIONS: for the GAPS, propose keywords + the search intent behind each, to research next.

Return STRICT JSON only (no prose, no fences), EXACTLY:
{
  "centralEntity": string,
  "sourceContext": string,
  "centralSearchIntent": string,
  "pillars": [ { "title": string, "entity": string, "clusters": [ { "title": string, "entity": string, "support": [ { "title": string, "queryType": "Definition"|"Problem"|"Solution"|"Comparison"|"Beginner", "entity": string, "covered": boolean } ] } ] } ],
  "ontology": [ { "from": string, "relation": string, "to": string } ],
  "gaps": { "coverage": string[], "depth": string[], "experience": string[] },
  "researchSuggestions": [ { "keyword": string, "intent": string, "why": string } ],
  "internalLinks": [ { "from": string, "to": string, "anchor": string } ],
  "qualityNodes": [ { "title": string, "why": string } ],
  "publishingOrder": string[]
}
Produce 3-5 pillars, 2-4 clusters each, 2-3 support each; 8-14 ontology edges; 3-5 per gap type; 4-8 researchSuggestions; 6-10 internal links; 1-3 quality nodes.`;

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

async function fetchSite(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(normalizeUrl(url), {
      headers: { "user-agent": "Mozilla/5.0 (compatible; SEOStudioBot/1.0)", accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return "";
    const html = await res.text();
    return html.slice(0, 12000);
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  let seed = "", sourceContext = "", siteUrl = "", sources = "";
  try {
    const body = await req.json();
    seed = String(body.seed || "").trim();
    sourceContext = String(body.sourceContext || "").trim();
    siteUrl = String(body.siteUrl || "").trim();
    sources = String(body.sources || "").trim().slice(0, 12000);
    if (!seed) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "Enter a seed keyword / central entity." }, { status: 400 });
  }

  const siteContent = siteUrl ? await fetchSite(siteUrl) : "";

  const parts = [
    `Central Entity (seed): ${seed}`,
    `Source Context: ${sourceContext || "(infer)"}`,
  ];
  if (siteContent) parts.push(`\nSITE CONTENT (the user's own site — judge existing coverage):\n"""\n${siteContent}\n"""`);
  if (sources) parts.push(`\nSOURCES (the user's own material — ground the map and fill gaps with these):\n"""\n${sources}\n"""`);
  parts.push("\nReturn only the JSON topical map.");

  try {
    const text = await generate({
      system: SYSTEM,
      temperature: 0.5,
      maxTokens: 6000,
      messages: [{ role: "user", content: parts.join("\n") }],
    });
    return NextResponse.json(extractJson(text));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
