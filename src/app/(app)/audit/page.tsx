"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

type Sev = "critical" | "high" | "medium" | "low";
type FixItem = { label: string; severity: Sev; pagesAffected: number; potential: number; detail: string };
type TopPage = { url: string; title: string; authority: number; inLinks: number; outLinks: number; depth: number };
type Issue = { url: string; type: string; label: string; severity: Sev; detail: string };
type Result = {
  site: string;
  host: string;
  pagesAudited: number;
  overall: number;
  healthLabel: string;
  aiVisibility: number;
  criticalCount: number;
  totalIssues: number;
  summary: string;
  recommendations: { title: string; metaDescription: string; h1: string; faqs: { q: string; a: string }[] } | null;
  fixPack: FixItem[];
  linkAuthority: {
    avgAuthority: number;
    orphanCount: number;
    deadEndCount: number;
    deepCount: number;
    topPages: TopPage[];
    orphanPages: string[];
    deadEndPages: string[];
  };
  issues: Issue[];
};

const SEV_CLASS: Record<Sev, string> = { critical: "crit", high: "high", medium: "med", low: "low" };
const SEV_ORDER: Sev[] = ["critical", "high", "medium", "low"];

function path(u: string): string {
  try {
    const x = new URL(u);
    return x.pathname === "/" ? "/ (home)" : x.pathname;
  } catch {
    return u;
  }
}

function PLink({ href, muted }: { href: string; muted?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mono"
      style={{ fontSize: 11.5, color: muted ? "var(--soft)" : "var(--purple)", textDecoration: "none", wordBreak: "break-all" }}
      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
    >
      {path(href)} ↗
    </a>
  );
}

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed.");
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const grouped = result
    ? SEV_ORDER.map((s) => ({ sev: s, items: result.issues.filter((i) => i.severity === s) })).filter((g) => g.items.length)
    : [];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 36px 60px" }}>
      <p className="eyebrow accent">Site &amp; Technical Audit</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>Full-site SEO, GEO &amp; AEO audit</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 640 }}>
        Paste a URL. We crawl the site, map its internal-link authority, and score every page across search,
        generative-engine and answer-engine readiness — grouped into a prioritized fix pack.
      </p>

      <form onSubmit={run} style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <input
          className="field"
          placeholder="example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button className="btn" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spin" /> Crawling…</> : <>Run audit <span className="sub">1 credit</span></>}
        </button>
      </form>

      {error && (
        <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}>
          <span style={{ color: "#a13a26", fontSize: 14, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {loading && !result && (
        <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
          Crawling up to 18 pages, building the link graph and scoring each page — this takes ~30–50 seconds.
        </p>
      )}

      {result && (
        <div className="reveal" style={{ marginTop: 30 }}>
          {/* top stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div className="tile" style={{ borderColor: "var(--purple)", background: "var(--purple-soft)" }}>
              <div className="label">Overall score</div>
              <div className="value" style={{ color: "var(--purple)" }}>{result.overall}</div>
              <div className="meta">{result.healthLabel}</div>
            </div>
            <div className="tile">
              <div className="label">Pages audited</div>
              <div className="value">{result.pagesAudited}</div>
              <div className="meta">crawled</div>
            </div>
            <div className="tile">
              <div className="label">Critical issues</div>
              <div className="value" style={{ color: result.criticalCount ? "#c0472f" : "var(--ink)" }}>{result.criticalCount}</div>
              <div className="meta">must fix</div>
            </div>
            <div className="tile">
              <div className="label">Total issues</div>
              <div className="value">{result.totalIssues}</div>
              <div className="meta">across all pages</div>
            </div>
            <div className="tile">
              <div className="label">AI visibility</div>
              <div className="value">{result.aiVisibility}</div>
              <div className="meta">out of 100</div>
            </div>
          </div>

          {/* executive summary */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd"><h3>Executive summary</h3><span className="muted" style={{ fontSize: 12 }}>{result.host}</span></div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--soft)" }}>{result.summary}</p>
          </div>

          {/* recommended fixes — concrete, copy-ready */}
          {result.recommendations && (
            <div className="card" style={{ marginTop: 16, borderColor: "var(--purple)" }}>
              <div className="card-hd"><h3>Recommended fixes for your homepage</h3><span className="muted" style={{ fontSize: 12 }}>ready to paste</span></div>
              {([["Title tag", result.recommendations.title], ["Meta description", result.recommendations.metaDescription], ["H1 heading", result.recommendations.h1]] as const).map(([label, val], i) => (
                <div key={label} style={{ padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <span className="eyebrow accent" style={{ marginBottom: 4 }}>{label}</span>
                    <button className="mono" onClick={() => navigator.clipboard?.writeText(val)} style={{ fontSize: 11, color: "var(--purple)", fontWeight: 600, flexShrink: 0 }}>Copy</button>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{val}</div>
                </div>
              ))}
              {result.recommendations.faqs?.length ? (
                <div style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                  <span className="eyebrow accent" style={{ display: "block", marginBottom: 8 }}>Suggested FAQ (add as FAQPage schema)</span>
                  {result.recommendations.faqs.map((f, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f.q}</div>
                      <div className="muted" style={{ fontSize: 13, marginTop: 2, lineHeight: 1.45 }}>{f.a}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* fix pack */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd">
              <h3>Fix pack</h3>
              <span className="muted" style={{ fontSize: 12 }}>{result.fixPack.length} actions · grouped by issue</span>
            </div>
            {result.fixPack.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "13px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="mono muted" style={{ fontSize: 13, width: 22, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{f.label}</span>
                    <span className={`badge ${SEV_CLASS[f.severity]}`}>{f.severity}</span>
                    <span className="muted" style={{ fontSize: 12.5 }}>{f.pagesAffected} page{f.pagesAffected === 1 ? "" : "s"} affected</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>{f.detail}</div>
                </div>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--purple)", fontWeight: 600, flexShrink: 0 }}>+{f.potential}</span>
              </div>
            ))}
          </div>

          {/* internal link authority */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "28px 0 6px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Internal link authority</h2>
            <span className="muted" style={{ fontSize: 12.5 }}>PageRank-style analysis of the site&apos;s link graph</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div className="tile"><div className="label">Avg authority</div><div className="value">{result.linkAuthority.avgAuthority}</div><div className="meta">of 100</div></div>
            <div className="tile"><div className="label">Orphan pages</div><div className="value" style={{ color: result.linkAuthority.orphanCount ? "#c0472f" : "var(--ink)" }}>{result.linkAuthority.orphanCount}</div><div className="meta">no links in</div></div>
            <div className="tile"><div className="label">Dead-end pages</div><div className="value" style={{ color: result.linkAuthority.deadEndCount ? "#c9a400" : "var(--ink)" }}>{result.linkAuthority.deadEndCount}</div><div className="meta">no links out</div></div>
            <div className="tile"><div className="label">Deep pages</div><div className="value">{result.linkAuthority.deepCount}</div><div className="meta">&gt;3 clicks</div></div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-hd"><h3>Top authority pages</h3><span className="muted" style={{ fontSize: 12 }}>authority · in / out links · depth</span></div>
            {result.linkAuthority.topPages.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--purple)", width: 34, flexShrink: 0, textAlign: "right" }}>{p.authority}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                  <PLink href={p.url} muted />
                </div>
                <span className="mono muted" style={{ fontSize: 12, flexShrink: 0 }}>↓{p.inLinks} ↑{p.outLinks} · d{p.depth}</span>
              </div>
            ))}
          </div>

          {(result.linkAuthority.orphanPages.length || result.linkAuthority.deadEndPages.length) ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 14 }}>
              {result.linkAuthority.orphanPages.length ? (
                <div className="card" style={{ borderColor: "#e6c3ba", background: "#fdf4f1" }}>
                  <div className="card-hd"><h3>Orphan pages</h3><span className="muted" style={{ fontSize: 12 }}>no internal links point here</span></div>
                  {result.linkAuthority.orphanPages.map((u, i) => (
                    <div key={i} style={{ padding: "5px 0" }}><PLink href={u} /></div>
                  ))}
                </div>
              ) : null}
              {result.linkAuthority.deadEndPages.length ? (
                <div className="card" style={{ borderColor: "#e8dcb0", background: "#fdfaef" }}>
                  <div className="card-hd"><h3>Dead-end pages</h3><span className="muted" style={{ fontSize: 12 }}>no outgoing internal links</span></div>
                  {result.linkAuthority.deadEndPages.map((u, i) => (
                    <div key={i} style={{ padding: "5px 0" }}><PLink href={u} /></div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* issues by severity */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "28px 0 10px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Issues by severity</h2>
            <span className="muted" style={{ fontSize: 12.5 }}>{result.issues.length} shown</span>
          </div>
          {grouped.map((g) => (
            <div key={g.sev} className="card" style={{ marginBottom: 14 }}>
              <div className="card-hd">
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`badge ${SEV_CLASS[g.sev]}`}>{g.sev}</span> {g.items.length} issue{g.items.length === 1 ? "" : "s"}
                </h3>
              </div>
              {g.items.map((it, i) => (
                <div key={i} style={{ padding: "9px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.label}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2, lineHeight: 1.45 }}>{it.detail}</div>
                  <div style={{ marginTop: 3 }}><PLink href={it.url} muted /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
