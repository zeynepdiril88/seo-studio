"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Comp = {
  query: string;
  market: string;
  pagesAnalyzed: number;
  competitors: { url: string; title: string; format: string; wordCount: string; sourceProfile: string; standout: string; weakness: string; skeleton: string[]; sources: string[] }[];
  commonSkeleton: { block: string; frequency: string; detail: string }[];
  keywordMap: { core: string[]; secondary: string[]; mechanism: string[]; practice: string[]; application: string[]; questions: string[] };
  gaps: { title: string; detail: string }[];
  eeatGaps: { title: string; detail: string }[];
  aiSearchGaps: { title: string; detail: string }[];
  whatToBeat: string;
  aiOverviewSnapshot: string;
};

function Section({ n, title, hint, children }: { n: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="mono accent" style={{ color: "var(--purple)", fontSize: 13, fontWeight: 700 }}>{n}</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>{title}</h2>
      </div>
      {hint ? <p className="muted" style={{ fontSize: 13.5, marginTop: 6, maxWidth: 720, lineHeight: 1.55 }}>{hint}</p> : null}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

function OppCard({ title, detail, tag }: { title: string; detail: string; tag?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      {tag ? <span className="badge med" style={{ marginBottom: 8, display: "inline-block" }}>{tag}</span> : null}
      <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
      <p className="muted" style={{ fontSize: 13, marginTop: 5, lineHeight: 1.55 }}>{detail}</p>
    </div>
  );
}

function Cluster({ label, terms }: { label: string; terms: string[] }) {
  if (!terms?.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {terms.map((t) => <span key={t} className="chip">{t}</span>)}
      </div>
    </div>
  );
}

function ReportInner() {
  const sp = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Comp | null>(null);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    const q = sp.get("q");
    if (q) setQuery(q);
  }, [sp]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed.");
      setData(d as Comp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 36px 70px" }}>
      <p className="eyebrow accent">Intelligence · Opportunity Report</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>SERP content opportunity report</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 660, lineHeight: 1.55 }}>
        Enter a query. We analyze the pages that rank for it and surface the openings — content gaps, the
        EEAT procedures none of them apply, and AI-search formats they all miss — so you know exactly where to win.
      </p>

      <form onSubmit={run} style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <input className="field" placeholder="A query to report on — e.g. mind body connection" value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false} />
        <button className="btn" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spin" /> Analyzing…</> : <>Generate report <span className="sub">1 credit</span></>}
        </button>
      </form>

      {error && <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>{error}</span></div>}
      {loading && !data && <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Analyzing the ranking pages, their skeletons and the gaps — ~15–30 seconds.</p>}

      {data && (
        <div className="reveal" style={{ marginTop: 34 }}>
          {/* report header */}
          <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 20 }}>
            <p className="eyebrow accent">Content strategy report</p>
            <h2 className="h-display" style={{ fontSize: 32, marginTop: 8, letterSpacing: "-0.6px" }}>{data.query}</h2>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 12, display: "flex", gap: 18, flexWrap: "wrap" }}>
              <span><strong style={{ color: "var(--ink)" }}>Market:</strong> {data.market}</span>
              <span><strong style={{ color: "var(--ink)" }}>Pages analyzed:</strong> {data.pagesAnalyzed}</span>
              <span><strong style={{ color: "var(--ink)" }}>Date:</strong> {today}</span>
            </p>
          </div>

          <Section n="01" title="Competitor content table" hint="The pages that typically rank organically, by format, depth and source profile — with each one's strongest feature and its weakest point.">
            <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: "var(--r)" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720, fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "var(--nav)", textAlign: "left" }}>
                    {["Site", "Format", "Words", "Sources", "Standout", "Weakness"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", fontWeight: 700, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.competitors.map((c, i) => (
                    <tr key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", verticalAlign: "top" }}>
                      <td style={{ padding: "10px 12px", minWidth: 130 }}>
                        <div style={{ fontWeight: 700 }}>{c.title}</div>
                        <div className="mono muted" style={{ fontSize: 11 }}>{c.url}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}><span className="badge low">{c.format}</span></td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }} className="mono">{c.wordCount}</td>
                      <td style={{ padding: "10px 12px", minWidth: 140 }} className="muted">{c.sourceProfile}</td>
                      <td style={{ padding: "10px 12px", minWidth: 150 }}>{c.standout}</td>
                      <td style={{ padding: "10px 12px", minWidth: 150, color: "#a13a26" }}>{c.weakness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section n="02" title="Common content skeleton" hint="The blocks the ranking pages share, and how many of them include each — the shape you have to match before you can beat them.">
            <div className="card">
              {data.commonSkeleton.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <span className="mono" style={{ color: "var(--purple)", fontWeight: 700, fontSize: 12.5, flexShrink: 0, width: 44 }}>{b.frequency}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{b.block}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{b.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section n="03" title="Semantic keyword map" hint="The semantic space clustered — the terms and questions the topic demands, grouped by role.">
            <div className="card">
              <Cluster label="Core" terms={data.keywordMap.core} />
              <Cluster label="Secondary (H2-level)" terms={data.keywordMap.secondary} />
              <Cluster label="Mechanism / science" terms={data.keywordMap.mechanism} />
              <Cluster label="Practice / techniques" terms={data.keywordMap.practice} />
              <Cluster label="Application / long-tail" terms={data.keywordMap.application} />
              <Cluster label="Questions (PAA / snippet)" terms={data.keywordMap.questions} />
            </div>
          </Section>

          <Section n="04" title="Content gaps & opportunities" hint="What few or none of them cover — the openings to claim.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {data.gaps.map((g, i) => <OppCard key={i} title={g.title} detail={g.detail} />)}
            </div>
          </Section>

          <Section n="05" title="EEAT gaps — none of them do this" hint="Experience, Expertise, Authoritativeness and Trust procedures the ranking pages all skip — each one is a direct differentiation opening.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {data.eeatGaps.map((g, i) => <OppCard key={i} title={g.title} detail={g.detail} tag="EEAT" />)}
            </div>
          </Section>

          <Section n="06" title="AI-search / GEO format opportunities" hint="Formats that win citations in ChatGPT, Perplexity and AI Overviews that the ranking pages leave on the table.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {data.aiSearchGaps.map((g, i) => <OppCard key={i} title={g.title} detail={g.detail} tag="AI search" />)}
            </div>
          </Section>

          <Section n="07" title="The bottom line">
            <div className="card" style={{ borderColor: "var(--purple)", background: "var(--purple-soft)" }}>
              <div className="eyebrow accent">Weakest common point — what to beat</div>
              <p style={{ fontSize: 15, fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>{data.whatToBeat}</p>
            </div>
            {data.aiOverviewSnapshot ? (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="card-hd"><h3>How AI answers this today</h3><span className="muted" style={{ fontSize: 12 }}>AI Overview snapshot</span></div>
                <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{data.aiOverviewSnapshot}</p>
              </div>
            ) : null}
          </Section>

          <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="btn" href={"/write?q=" + encodeURIComponent(data.query)}>Turn a gap into content →</a>
            <a className="btn-outline" href={"/authority?seed=" + encodeURIComponent(data.query)}>Build the topical map</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 36 }} className="muted">Loading…</div>}>
      <ReportInner />
    </Suspense>
  );
}
