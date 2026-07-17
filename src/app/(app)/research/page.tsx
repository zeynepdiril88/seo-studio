"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

type Query = { query: string; intent: string; funnel: string; entity: string };
type Group = { type: string; queries: Query[] };
type Research = {
  centralEntity: string;
  relatedEntities: string[];
  semanticTerms: { important: string[]; extended: string[] };
  queryTypes: Group[];
  communityDemand?: { reddit: string[]; youtube: string[] };
};

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

const TYPE_CLASS: Record<string, string> = { Definition: "b-med", Problem: "b-high", Solution: "b-med", Comparison: "b-low", Beginner: "b-low" };

export default function ResearchPage() {
  const [seed, setSeed] = useState("");
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Research | null>(null);
  const [comp, setComp] = useState<Comp | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState("");

  async function analyzeCompetitors() {
    if (!seed.trim() || compLoading) return;
    setCompLoading(true); setCompError(""); setComp(null);
    try {
      const res = await fetch("/api/competitors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: seed }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed.");
      setComp(json as Comp);
    } catch (err) {
      setCompError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCompLoading(false);
    }
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!seed.trim() || loading) return;
    setLoading(true); setError(""); setData(null);
    void analyzeCompetitors(); // run competitor analysis in parallel with the query universe
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed, sourceContext: ctx }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed.");
      setData(json as Research);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 36px 60px" }}>
      <p className="eyebrow accent">Keyword / Query Research</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>Find the query universe</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 640 }}>
        A seed keyword isn&apos;t the goal — the <strong style={{ color: "var(--ink)" }}>queries</strong> behind it are.
        Claude maps the full query universe by type, plus the related entities and semantic terms. Send any query to an outline.
      </p>

      <form onSubmit={run} style={{ display: "grid", gap: 10, marginTop: 22, maxWidth: 720 }}>
        <input className="field" placeholder="Seed keyword / central entity — e.g. nervous system regulation" value={seed} onChange={(e) => setSeed(e.target.value)} spellCheck={false} />
        <div style={{ display: "flex", gap: 10 }}>
          <input className="field" placeholder="Source context (optional)" value={ctx} onChange={(e) => setCtx(e.target.value)} spellCheck={false} />
          <button className="btn" disabled={loading} style={{ flexShrink: 0 }}>
            {loading ? <><span className="spin" /> Finding…</> : <>Find queries <span className="sub">1 credit</span></>}
          </button>
        </div>
      </form>

      {compError && <div className="card" style={{ marginTop: 14, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>Competitors: {compError}</span></div>}
      {compLoading && !comp && <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>Analyzing the competitive landscape and gaps…</p>}

      {comp && (
        <div className="reveal" style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "6px 0 4px" }}>Competitor content report</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>{comp.pagesAnalyzed || comp.competitors?.length} pages · {comp.market || "US"} · <span className="chip ghost" style={{ fontSize: 10 }}>representative</span></p>

          <div className="card">
            <div className="card-hd"><h3>Ranking pages</h3><span className="muted" style={{ fontSize: 12 }}>click a row for its outline</span></div>
            {comp.competitors?.map((c, i) => (
              <details key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", padding: "10px 0" }}>
                <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span className="mono muted" style={{ fontSize: 12, width: 18 }}>{i + 1}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                  {c.format && <span className="chip" style={{ fontSize: 11 }}>{c.format}</span>}
                  {c.wordCount && <span className="mono muted" style={{ fontSize: 12 }}>{c.wordCount}</span>}
                </summary>
                <div style={{ paddingLeft: 28, marginTop: 6 }}>
                  <a href={c.url} target="_blank" rel="noreferrer" className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>{c.url}</a>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 10 }}>
                    <div>
                      <div className="eyebrow" style={{ marginBottom: 6 }}>Outline</div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>{(c.skeleton || []).map((s, j) => <li key={j} style={{ fontSize: 13, marginBottom: 3 }}>{s}</li>)}</ul>
                    </div>
                    <div>
                      <div className="eyebrow" style={{ marginBottom: 6 }}>Sources &amp; assets</div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>{(c.sources || []).map((s, j) => <li key={j} className="muted" style={{ fontSize: 13, marginBottom: 3 }}>{s}</li>)}</ul>
                    </div>
                  </div>
                  {c.sourceProfile && <div style={{ fontSize: 12.5, marginTop: 8 }}><strong>Sources:</strong> <span className="muted">{c.sourceProfile}</span></div>}
                  {c.standout && <div style={{ fontSize: 12.5, marginTop: 3, color: "var(--purple)" }}>+ {c.standout}</div>}
                  {c.weakness && <div style={{ fontSize: 12.5, marginTop: 2, color: "var(--soft)" }}>− {c.weakness}</div>}
                </div>
              </details>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd"><h3>Common content skeleton</h3></div>
            {(comp.commonSkeleton || []).map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="mono muted" style={{ fontSize: 12, width: 24, flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.block} <span className="mono" style={{ fontSize: 11, color: "var(--purple)" }}>{b.frequency}</span></div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{b.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {comp.keywordMap && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-hd"><h3>Semantic keyword map</h3></div>
              {([["Core", comp.keywordMap.core], ["Secondary", comp.keywordMap.secondary], ["Mechanism / science", comp.keywordMap.mechanism], ["Practices", comp.keywordMap.practice], ["Applications", comp.keywordMap.application], ["Questions", comp.keywordMap.questions]] as const).map(([label, items]) =>
                items && items.length ? (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{items.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                  </div>
                ) : null
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-hd"><h3>Content gaps &amp; opportunities</h3></div>
              {(comp.gaps || []).map((g, i) => (
                <div key={i} style={{ padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.title}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{g.detail}</div>
                </div>
              ))}
              {comp.whatToBeat && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--purple-soft)", borderRadius: 10 }}>
                  <div className="eyebrow accent" style={{ marginBottom: 4 }}>What to beat</div>
                  <div style={{ fontSize: 13.5 }}>{comp.whatToBeat}</div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-hd"><h3>EEAT &amp; AI-search gaps</h3><span className="muted" style={{ fontSize: 11 }}>none apply these</span></div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>EEAT — nobody does</div>
              {(comp.eeatGaps || []).map((g, i) => (
                <div key={i} style={{ padding: "7px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{g.title}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{g.detail}</div>
                </div>
              ))}
              <div className="eyebrow" style={{ margin: "14px 0 6px" }}>AI search — missed formats</div>
              {(comp.aiSearchGaps || []).map((g, i) => (
                <div key={i} style={{ padding: "7px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{g.title}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{g.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {comp.aiOverviewSnapshot && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="eyebrow accent" style={{ marginBottom: 6 }}>AI Overview snapshot</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{comp.aiOverviewSnapshot}</div>
            </div>
          )}
        </div>
      )}

      {error && <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>{error}</span></div>}
      {loading && !data && <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Mapping the query universe and semantic terms — ~20–40 seconds.</p>}

      {data && (
        <div className="reveal" style={{ marginTop: 28 }}>
          {/* entities + terms */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
            <div className="card">
              <div className="card-hd"><h3>Central + related entities</h3></div>
              <div style={{ marginBottom: 6 }}><span className="chip" style={{ background: "var(--purple-soft)", color: "var(--purple)", borderColor: "transparent" }}>{data.centralEntity}</span></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {data.relatedEntities.map((e) => <span key={e} className="chip">{e}</span>)}
              </div>
            </div>
            <div className="card">
              <div className="card-hd"><h3>Semantic terms</h3></div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Important · must-use</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {data.semanticTerms.important.map((t) => <span key={t} className="chip">{t}</span>)}
              </div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Extended · where relevant</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {data.semanticTerms.extended.map((t) => <span key={t} className="chip ghost">{t}</span>)}
              </div>
            </div>
          </div>

          {/* query universe */}
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "26px 0 6px" }}>Query universe</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Grouped by query type · send any query straight to an outline.</p>
          <div style={{ display: "grid", gap: 14 }}>
            {data.queryTypes.map((g, gi) => (
              <div key={gi} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span className={`badge ${TYPE_CLASS[g.type] || "b-low"}`}>{g.type}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{g.queries.length} queries</span>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {g.queries.map((q, qi) => (
                    <div key={qi} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--nav)", borderRadius: 8, border: "1px solid var(--line)" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{q.query}</span>
                        <span className="muted" style={{ fontSize: 12, display: "block", marginTop: 2 }}>{q.intent} · <span className="mono">{q.funnel}</span> · {q.entity}</span>
                      </span>
                      <Link href={"/write?q=" + encodeURIComponent(q.query)} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>Outline <Icon name="arrow" size={14} /></Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {data.communityDemand && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 16 }}>
              <div className="card">
                <div className="card-hd"><h3>Reddit demand</h3><span className="chip ghost" style={{ fontSize: 11 }}>representative</span></div>
                {(data.communityDemand.reddit || []).map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                    <span style={{ flex: 1, fontSize: 13.5 }}>{q}</span>
                    <Link href={"/write?q=" + encodeURIComponent(q)} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>Outline →</Link>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-hd"><h3>YouTube demand</h3><span className="chip ghost" style={{ fontSize: 11 }}>representative</span></div>
                {(data.communityDemand.youtube || []).map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                    <span style={{ flex: 1, fontSize: 13.5 }}>{q}</span>
                    <Link href={"/write?q=" + encodeURIComponent(q)} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>Outline →</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Community demand is representative (from the model&apos;s knowledge), not scraped. Real Reddit/YouTube data can be added via Apify.</p>
        </div>
      )}
    </div>
  );
}
