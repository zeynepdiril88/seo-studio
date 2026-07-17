import { NextResponse } from "next/server";
import { generate, extractJson } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PAGES = 40;
const CONCURRENCY = 6;
const FETCH_TIMEOUT = 8000;
const CRAWL_BUDGET_MS = 40000;
const UA = "Mozilla/5.0 (compatible; SEOStudioBot/1.0; +https://seo-studio.app)";

type Sev = "critical" | "high" | "medium" | "low";
type Signals = {
  url: string;
  title: string;
  hasMetaDesc: boolean;
  hasViewport: boolean;
  hasCanonical: boolean;
  h1Count: number;
  h2h3Count: number;
  schemaTypes: string[];
  hasFAQ: boolean;
  wordCount: number;
  imgNoAlt: number;
  hasSameAs: boolean;
  hasStats: boolean;
  outLinks: string[];
  depth: number;
};
type Issue = { url: string; type: string; label: string; severity: Sev; detail: string };

const ASSET_RE = /\.(jpe?g|png|gif|svg|webp|css|js|pdf|zip|ico|woff2?|ttf|mp4|mp3|json|xml)(\?|#|$)/i;
const SKIP_RE = /(\/wp-admin|\/wp-json|\/feed|\/cart|\/checkout|\/my-account|add-to-cart|\/attachment\/|attachment_id=)/i;

function normalizeInput(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}
function normUrl(u: string): string {
  try {
    const x = new URL(u);
    let s = x.origin + x.pathname;
    if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
    return s;
  } catch {
    return u;
  }
}
function skipLink(u: string): boolean {
  if (/^(mailto:|tel:|javascript:)/i.test(u)) return true;
  if (ASSET_RE.test(u)) return true;
  if (SKIP_RE.test(u)) return true;
  return false;
}

async function fetchPage(u: string): Promise<{ url: string; ok: boolean; html: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(u, { headers: { "user-agent": UA, accept: "text/html" }, signal: controller.signal, redirect: "follow" });
    clearTimeout(t);
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("text/html")) return { url: res.url || u, ok: false, html: "" };
    const html = (await res.text()).slice(0, 250000);
    return { url: res.url || u, ok: true, html };
  } catch {
    clearTimeout(t);
    return { url: u, ok: false, html: "" };
  }
}

function extractLinks(html: string, base: string, origin: string): string[] {
  const out = new Set<string>();
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (!href || skipLink(href)) continue;
    let abs: string;
    try {
      abs = new URL(href, base).href;
    } catch {
      continue;
    }
    if (!abs.startsWith(origin)) continue;
    if (skipLink(abs)) continue;
    out.add(normUrl(abs));
  }
  return [...out];
}

async function fetchText(u: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(u, { headers: { "user-agent": UA }, signal: controller.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return "";
    return (await res.text()).slice(0, 500000);
  } catch {
    clearTimeout(t);
    return "";
  }
}

// The site's declared pages, from sitemap.xml — needed to find orphans (a link crawl
// alone can never reach a page that nothing links to).
async function fetchSitemap(origin: string): Promise<string[]> {
  const urls = new Set<string>();
  async function load(sm: string, depth: number) {
    if (depth > 2 || urls.size > 300) return;
    const xml = await fetchText(sm);
    if (!xml) return;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
    if (/<sitemapindex/i.test(xml)) {
      // Skip attachment/author/media child sitemaps — they list low-value pages nothing links to.
      const children = locs.filter((l) => l.startsWith(origin) && /\.xml/i.test(l) && !/(attachment|author|media)-sitemap/i.test(l));
      await Promise.all(children.slice(0, 6).map((c) => load(c, depth + 1)));
    } else {
      for (const l of locs) if (l.startsWith(origin) && !skipLink(l) && !/\.xml/i.test(l)) urls.add(normUrl(l));
    }
  }
  for (const candidate of ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"]) {
    if (urls.size) break;
    await load(origin + candidate, 0);
  }
  return [...urls];
}

function textContent(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function analyze(url: string, html: string, origin: string): Signals {
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? titleM[1].replace(/\s+/g, " ").trim() : "";
  const hasMetaDesc =
    /<meta[^>]+name\s*=\s*["']description["'][^>]*content\s*=\s*["'][^"']+["']/i.test(html) ||
    /<meta[^>]+content\s*=\s*["'][^"']+["'][^>]*name\s*=\s*["']description["']/i.test(html);
  const hasViewport = /<meta[^>]+name\s*=\s*["']viewport["']/i.test(html);
  const hasCanonical = /<link[^>]+rel\s*=\s*["']canonical["']/i.test(html);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const h2h3Count = (html.match(/<h[23]\b/gi) || []).length;
  const schemaTypes = [...new Set([...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((x) => x[1]))];
  const hasFAQ = schemaTypes.includes("FAQPage");
  const text = textContent(html);
  const wordCount = text ? text.split(" ").filter(Boolean).length : 0;
  const imgNoAlt = (html.match(/<img\b(?![^>]*\balt\s*=)[^>]*>/gi) || []).length;
  const hasSameAs = /sameAs/i.test(html) || /(facebook|twitter|linkedin|instagram|youtube)\.com/i.test(html);
  const hasStats = /\b\d+(\.\d+)?\s*%/.test(text) || (text.match(/\b\d{2,}\b/g) || []).length >= 3;
  const outLinks = extractLinks(html, url, origin);
  return { url: normUrl(url), title, hasMetaDesc, hasViewport, hasCanonical, h1Count, h2h3Count, schemaTypes, hasFAQ, wordCount, imgNoAlt, hasSameAs, hasStats, outLinks, depth: 0 };
}

export async function POST(req: Request) {
  let input: string;
  try {
    const b = await req.json();
    input = normalizeInput(String(b.url || ""));
    new URL(input);
    if (!/\./.test(input)) throw new Error("invalid");
  } catch {
    return NextResponse.json({ error: "Please enter a valid URL (e.g. example.com)." }, { status: 400 });
  }

  const first = await fetchPage(input);
  if (!first.ok) {
    return NextResponse.json({ error: "Could not reach that site. Check the URL and try again." }, { status: 502 });
  }
  const origin = new URL(first.url).origin;
  const host = new URL(first.url).host;

  const started = Date.now();
  const seen = new Set<string>();
  const pages: Signals[] = [];
  const havePage = new Set<string>();

  const entryUrl = normUrl(first.url);
  seen.add(entryUrl);
  const entrySig = analyze(first.url, first.html, origin);
  pages.push(entrySig);
  havePage.add(entrySig.url);

  // Seed the crawl with the homepage's links AND the sitemap's declared pages, so orphans
  // (pages nothing links to) get visited and their real in-link count can be measured.
  const sitemapUrls = await fetchSitemap(origin);
  let frontier: string[] = [];
  for (const l of [...entrySig.outLinks, ...sitemapUrls]) {
    if (!seen.has(l)) {
      seen.add(l);
      frontier.push(l);
    }
  }

  while (frontier.length && pages.length < MAX_PAGES && Date.now() - started < CRAWL_BUDGET_MS) {
    const batch = frontier.slice(0, CONCURRENCY);
    frontier = frontier.slice(CONCURRENCY);
    const results = await Promise.all(batch.map((u) => fetchPage(u)));
    for (const r of results) {
      if (pages.length >= MAX_PAGES) break;
      if (!r.ok) continue;
      const sig = analyze(r.url, r.html, origin);
      if (havePage.has(sig.url)) continue;
      pages.push(sig);
      havePage.add(sig.url);
      for (const l of sig.outLinks) {
        if (!seen.has(l) && seen.size < 300) {
          seen.add(l);
          frontier.push(l);
        }
      }
    }
  }

  const N = pages.length;
  const urlSet = new Set(pages.map((p) => p.url));
  const inLinks = new Map<string, Set<string>>();
  const outWithin = new Map<string, string[]>();
  pages.forEach((p) => inLinks.set(p.url, new Set()));
  for (const p of pages) {
    const outs = [...new Set(p.outLinks.filter((l) => urlSet.has(l) && l !== p.url))];
    outWithin.set(p.url, outs);
    for (const l of outs) inLinks.get(l)!.add(p.url);
  }

  // simplified PageRank for internal link authority
  let rank = new Map(pages.map((p) => [p.url, 1 / N]));
  const damp = 0.85;
  for (let it = 0; it < 25; it++) {
    const next = new Map(pages.map((p) => [p.url, (1 - damp) / N]));
    let dangling = 0;
    for (const p of pages) if (outWithin.get(p.url)!.length === 0) dangling += rank.get(p.url)!;
    for (const p of pages) {
      const outs = outWithin.get(p.url)!;
      if (outs.length) {
        const share = (rank.get(p.url)! * damp) / outs.length;
        for (const o of outs) next.set(o, next.get(o)! + share);
      }
    }
    const dShare = (damp * dangling) / N;
    for (const p of pages) next.set(p.url, next.get(p.url)! + dShare);
    rank = next;
  }
  const maxRank = Math.max(...rank.values(), 1e-9);
  const authorityOf = (u: string) => Math.round((rank.get(u)! / maxRank) * 100);

  // Click-depth from the homepage over the crawled link graph (BFS).
  const depthOf = new Map<string, number>([[entryUrl, 0]]);
  const dq = [entryUrl];
  while (dq.length) {
    const u = dq.shift()!;
    const du = depthOf.get(u)!;
    for (const o of outWithin.get(u) || []) {
      if (!depthOf.has(o)) {
        depthOf.set(o, du + 1);
        dq.push(o);
      }
    }
  }
  pages.forEach((p) => (p.depth = depthOf.get(p.url) ?? 99));

  // Orphans: crawled pages that no other crawled page links to.
  const orphanPages = pages.filter((p) => p.url !== entryUrl && inLinks.get(p.url)!.size === 0).map((p) => p.url);
  // Dead-ends: crawled pages with no outgoing internal links at all.
  const deadEndPages = pages.filter((p) => p.outLinks.length === 0).map((p) => p.url);
  // Deep: reachable but more than 3 clicks from the homepage.
  const deepPages = pages.filter((p) => p.depth > 3 && p.depth < 99);
  const avgAuthority = Math.round(pages.reduce((a, p) => a + authorityOf(p.url), 0) / N);

  const issues: Issue[] = [];
  for (const p of pages) {
    if (!p.title) issues.push({ url: p.url, type: "missing-title", label: "Missing Title Tag", severity: "critical", detail: "Add a unique, descriptive <title> tag." });
    if (p.h1Count === 0) issues.push({ url: p.url, type: "missing-h1", label: "Missing H1 Tag", severity: "critical", detail: "Add a single descriptive H1 heading." });
    else if (p.h1Count > 1) issues.push({ url: p.url, type: "multiple-h1", label: "Multiple H1 Tags", severity: "high", detail: "Keep exactly one H1 per page for a clear hierarchy." });
    if (!p.hasMetaDesc) issues.push({ url: p.url, type: "missing-meta", label: "Missing Meta Description", severity: "high", detail: "Add a compelling meta description of 120–160 characters." });
    if (!p.hasViewport) issues.push({ url: p.url, type: "missing-viewport", label: "Missing Viewport Meta", severity: "high", detail: "Add a responsive viewport meta tag for mobile." });
    if (!p.hasCanonical) issues.push({ url: p.url, type: "missing-canonical", label: "Missing Canonical Tag", severity: "low", detail: "Add a canonical link to prevent duplicate-content dilution." });
    if (p.wordCount < 300) issues.push({ url: p.url, type: "thin-content", label: "Thin Content", severity: "medium", detail: `Only ~${p.wordCount} words. Expand with unique, valuable content.` });
    if (p.schemaTypes.length === 0) issues.push({ url: p.url, type: "no-schema", label: "No Structured Data", severity: "medium", detail: "Add JSON-LD schema (WebPage, Organization, Product…)." });
    if (!p.hasFAQ) issues.push({ url: p.url, type: "no-faq", label: "No FAQ Schema Markup", severity: "medium", detail: "Add an FAQ section wrapped in FAQPage JSON-LD to win AI answers and snippets." });
    if (p.h2h3Count < 2) issues.push({ url: p.url, type: "weak-structure", label: "Content Structure Not Optimized For AI", severity: "medium", detail: "Add H2/H3 headings, tables and organized sections for better AI parsing." });
    if (!p.hasStats) issues.push({ url: p.url, type: "no-quotable", label: "Lacks Easily Quotable Statements", severity: "medium", detail: "Add concise factual sentences (15–40 words) with statistics AI can cite." });
    if (!p.hasSameAs) issues.push({ url: p.url, type: "no-entity", label: "Missing Entity Signals (sameAs)", severity: "medium", detail: "Add sameAs links to social/authority profiles in Organization schema." });
    if (p.imgNoAlt > 0) issues.push({ url: p.url, type: "img-alt", label: "Images Missing Alt Text", severity: "low", detail: `${p.imgNoAlt} image(s) missing alt text.` });
  }
  for (const u of orphanPages) issues.push({ url: u, type: "orphan", label: "Orphan Page", severity: "high", detail: "No internal links point to this page — add links so it can be discovered and pass authority." });
  for (const u of deadEndPages) issues.push({ url: u, type: "dead-end", label: "Dead-End Page", severity: "medium", detail: "This page links to no other pages — add outgoing internal links to distribute authority." });
  for (const p of deepPages) issues.push({ url: p.url, type: "deep", label: "Deep Page (>3 clicks)", severity: "low", detail: `${p.depth} clicks from the homepage — flatten the structure so it's easier to reach.` });

  const pageHealth = (p: Signals) => {
    let s = 100;
    if (!p.title) s -= 18;
    if (p.h1Count === 0) s -= 14;
    else if (p.h1Count > 1) s -= 6;
    if (!p.hasMetaDesc) s -= 8;
    if (!p.hasViewport) s -= 6;
    if (!p.hasCanonical) s -= 3;
    if (p.wordCount < 300) s -= 6;
    if (p.schemaTypes.length === 0) s -= 5;
    if (p.h2h3Count < 2) s -= 4;
    if (p.imgNoAlt > 0) s -= 3;
    return Math.max(0, s);
  };
  const overallBase = pages.reduce((a, p) => a + pageHealth(p), 0) / N;
  const overall = Math.max(0, Math.min(100, Math.round(overallBase - Math.min(12, orphanPages.length * 1.5))));

  const aiPoints = (p: Signals) => {
    let s = 0;
    if (p.hasFAQ) s += 25;
    if (p.schemaTypes.length > 0) s += 20;
    if (p.h2h3Count >= 3) s += 20;
    if (p.hasStats && p.wordCount >= 300) s += 15;
    if (p.hasSameAs) s += 20;
    return s;
  };
  const aiVisibility = Math.round(pages.reduce((a, p) => a + aiPoints(p), 0) / N);

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const totalIssues = issues.length;

  const sevRank: Record<Sev, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sevWeight: Record<Sev, number> = { critical: 4, high: 2.5, medium: 1.2, low: 0.5 };
  const byType = new Map<string, { label: string; severity: Sev; detail: string; urls: Set<string> }>();
  for (const iss of issues) {
    if (!byType.has(iss.type)) byType.set(iss.type, { label: iss.label, severity: iss.severity, detail: iss.detail, urls: new Set() });
    byType.get(iss.type)!.urls.add(iss.url);
  }
  const fixPack = [...byType.values()]
    .map((v) => ({
      label: v.label,
      severity: v.severity,
      pagesAffected: v.urls.size,
      potential: Math.min(40, Math.round(v.urls.size * sevWeight[v.severity])),
      detail: v.detail,
    }))
    .sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || b.pagesAffected - a.pagesAffected);

  const topPages = [...pages]
    .sort((a, b) => authorityOf(b.url) - authorityOf(a.url))
    .slice(0, 5)
    .map((p) => ({ url: p.url, title: p.title || p.url, authority: authorityOf(p.url), inLinks: inLinks.get(p.url)!.size, outLinks: outWithin.get(p.url)!.length, depth: p.depth }));

  const healthLabel = overall >= 75 ? "Healthy" : overall >= 50 ? "Needs Improvement" : "Poor";

  let summary = `Audited ${N} pages on ${host}. Overall health is ${overall}/100 (${healthLabel.toLowerCase()}) with ${criticalCount} critical and ${totalIssues} total issues. AI visibility scores ${aiVisibility}/100 — ${aiVisibility < 50 ? "weak" : "moderate"} readiness for AI search. Biggest opportunities: ${fixPack.slice(0, 3).map((f) => f.label.toLowerCase()).join(", ")}.`;
  try {
    const topList = fixPack.slice(0, 6).map((f) => `${f.label} (${f.pagesAffected} pages, ${f.severity})`).join("; ");
    const ai = await generate({
      system: "You are a senior technical SEO and GEO auditor. Write a concise 3-4 sentence executive summary of a site crawl. Be specific and actionable; reference the actual numbers. No preamble, no bullet lists.",
      json: false,
      temperature: 0.4,
      maxTokens: 400,
      messages: [
        {
          role: "user",
          content: `Site: ${host}\nPages crawled: ${N}\nOverall health: ${overall}/100\nAI visibility: ${aiVisibility}/100\nCritical issues: ${criticalCount}\nTotal issues: ${totalIssues}\nOrphan pages: ${orphanPages.length}\nDead-end pages: ${deadEndPages.length}\nTop issue types: ${topList}\n\nWrite the executive summary.`,
        },
      ],
    });
    if (ai && ai.trim().length > 40) summary = ai.trim();
  } catch {
    // keep the templated summary
  }

  // Concrete, ready-to-use fixes for the homepage — the tangible "here's what to write" step.
  let recommendations: { title: string; metaDescription: string; h1: string; faqs: { q: string; a: string }[] } | null = null;
  try {
    const homeText = textContent(first.html).slice(0, 3500);
    const rec = await generate({
      system:
        'You are an SEO + GEO copywriter. Given a homepage\'s content, propose concrete, ready-to-paste fixes specific to THIS site (not generic advice). Return STRICT JSON only: { "title": string (50-60 chars), "metaDescription": string (120-160 chars), "h1": string, "faqs": [{ "q": string, "a": string }] } with exactly 3 FAQs. Answers are concise, factual and citable.',
      temperature: 0.5,
      maxTokens: 700,
      messages: [
        {
          role: "user",
          content: `Site: ${host}\nCurrent title: ${entrySig.title || "(none)"}\n\nHomepage content:\n"""\n${homeText}\n"""\n\nReturn the JSON.`,
        },
      ],
    });
    recommendations = extractJson(rec);
  } catch {
    // recommendations are optional
  }

  return NextResponse.json({
    site: origin,
    host,
    pagesAudited: N,
    overall,
    healthLabel,
    aiVisibility,
    criticalCount,
    totalIssues,
    summary,
    recommendations,
    fixPack,
    linkAuthority: {
      avgAuthority,
      orphanCount: orphanPages.length,
      deadEndCount: deadEndPages.length,
      deepCount: deepPages.length,
      topPages,
      orphanPages: orphanPages.slice(0, 8),
      deadEndPages: deadEndPages.slice(0, 8),
    },
    issues: issues.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]).slice(0, 60),
  });
}
