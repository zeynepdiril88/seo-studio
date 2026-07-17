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
- TAXONOMY: specific-concept hierarchy, COMPREHENSIVE — cover the whole domain, not a thin sample. Pillars = macro-contexts (each a potential pillar page / hub); Clusters = subtopics that orbit a pillar; Support = long-tail queries. Go WIDE (many pillars) and DEEP (many clusters per pillar, many queries per cluster). NEVER generic buckets ("Tips","Blog","Health").
- HARD STRUCTURAL REQUIREMENT: EVERY pillar MUST contain 3-5 clusters — never 1 or 2. EVERY cluster MUST contain 3-4 support queries. A pillar with a single cluster, or a cluster with a single query, is an INCOMPLETE map — expand it before returning. Depth is as important as breadth.
- Every support node is a real QUERY, tagged queryType (Definition/Problem/Solution/Comparison/Beginner) and covered (boolean).
- ONTOLOGY: a dense semantic web of entity relationships that connects entities ACROSS pillars (not siloed per pillar) — relation ∈ affects, regulated-through, part-of, connected-with, causes, measured-by. Every pillar entity should appear in at least one edge.
- GAPS: coverage (missing topics), depth (go deeper), experience (frameworks/exercises/original methodology).
- INTERNAL LINKS: build the HUB-AND-SPOKE structure — every cluster links UP to its pillar page (the hub); ADD lateral links between semantically adjacent clusters/queries across different pillars (shared entity). anchor = descriptive entity phrase, never "click here". HARD MINIMUM: produce at least one internal link per cluster PLUS several lateral links — so internalLinks length is at least the number of clusters. Aim for a densely connected graph, not a sparse list.
- QUALITY NODES: 1-3 flagship framework pages.
- RESEARCH SUGGESTIONS: for the GAPS, propose keywords + the search intent behind each, to research next.
- ENTITY REINFORCEMENT (Knowledge Graph): for the central entity and the pillars, name the authoritative EXTERNAL entities to cite / link / sameAs — Wikipedia, Wikidata, official bodies, .gov / .edu, recognized named experts — that corroborate the topic and connect the site to the knowledge graph. source = the concrete reference; why = the signal it sends.
- RANKING SIGNAL TRANSITION: the publishing SEQUENCE that transitions topical coverage into ranking authority — ordered phases (what to publish first, next, last) and WHY each phase builds momentum (e.g. quality nodes first to set context, then the supporting queries to consolidate, then the comparison/BOFU nodes). Not a flat list — every phase justified.
- CONTENT PRUNING: ONLY when SITE CONTENT is provided — identify existing pages that are thin, outdated, overlapping or cannibalizing, and whether to prune (remove), merge (consolidate) or update (refresh), each with the reason. If no site content is given, return an empty pruning array.

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
  "entityReinforcement": [ { "entity": string, "source": string, "why": string } ],
  "rankingSignalTransition": [ { "phase": string, "publish": string, "why": string } ],
  "pruning": [ { "page": string, "action": "prune"|"merge"|"update", "why": string } ]
}
Produce 5-7 pillars; EACH pillar 3-5 clusters; EACH cluster 3-4 support queries — this must total ~18-30 clusters and ~60-100 support queries across the whole map (a shallow tree is a failure). Then: 14-24 ontology edges; 3-5 per gap type; 5-8 researchSuggestions; 15-25 internal links (hub-and-spoke + lateral); 2-3 quality nodes; 5-8 entityReinforcement; 3-5 rankingSignalTransition phases; 0-6 pruning items (empty array if no site content). Be comprehensive — a real topical map is wide AND deep.`;

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
      maxTokens: 24000,
      messages: [{ role: "user", content: parts.join("\n") }],
    });
    return NextResponse.json(extractJson(text));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
