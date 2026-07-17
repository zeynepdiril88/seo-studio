import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a senior SEO, GEO (Generative Engine Optimization) and AEO (Answer Engine Optimization) auditor.
You receive the raw HTML of a web page and return a rigorous, specific audit as STRICT JSON only — no prose, no markdown fences.

Score each dimension 0-100 based on evidence in the HTML:
- SEO: title, meta description, canonical, headings (single H1, logical H2/H3), Open Graph, robots, internal links, content depth.
- GEO (AI-search readiness): the 5 pillars, all required — crawlability signals, structured data depth, entity signals (Organization/Person schema, sameAs), corroboration cues, and content quality (self-contained paragraphs, one citable claim per H2, declarative sentences, quotable stats). Also direct-answer blocks and llms.txt awareness.
- AEO (answer engines / snippets): FAQ presence + FAQPage schema, concise answer blocks, question-style headings, featured-snippet eligibility.
- overall: a weighted blend.

Be concrete and reference what you actually saw (or its absence). Every fix must be actionable and specific to this page.

Return EXACTLY this JSON shape:
{
  "site": string,
  "scores": { "seo": number, "geo": number, "aeo": number, "overall": number },
  "healthLabel": string,
  "summary": string,
  "meta": [ { "label": string, "status": "pass"|"warn"|"fail", "detail": string } ],
  "schema": { "present": string[], "missing": string[] },
  "geoChecks": [ { "label": string, "status": "pass"|"warn"|"fail", "detail": string } ],
  "aeoChecks": [ { "label": string, "status": "pass"|"warn"|"fail", "detail": string } ],
  "fixes": [ { "title": string, "severity": "critical"|"high"|"medium"|"low", "impact": string, "detail": string } ]
}
Provide 6-8 meta rows, 5-7 geoChecks, 4-6 aeoChecks, and 8-12 fixes ordered most-impactful first.
Be specific and technical: reference the ACTUAL titles, headings, scripts, schema types and content gaps you saw in the HTML. Never give generic advice that could apply to any site — cite concrete evidence from this page.`;

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = normalizeUrl(String(body.url || ""));
    if (!/\./.test(url)) throw new Error("empty");
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Please enter a valid URL (e.g. example.com)." }, { status: 400 });
  }

  // Fetch the page server-side.
  let html = "";
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SEOStudioBot/1.0; +https://seo-studio.app)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) {
      return NextResponse.json({ error: `Could not fetch the page (HTTP ${res.status}).` }, { status: 502 });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Could not reach that URL. Check the address and try again." }, { status: 502 });
  }

  const snippet = html.slice(0, 30000);

  try {
    const text = await generate({
      system: SYSTEM,
      temperature: 0.3,
      maxTokens: 8192,
      think: true,
      messages: [
        {
          role: "user",
          content: `Audit this page. URL: ${url}\n\nRaw HTML (truncated):\n"""\n${snippet}\n"""\n\nReturn only the JSON.`,
        },
      ],
    });
    const result = extractJson(text);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Audit failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
