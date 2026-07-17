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
  competitors: { url: string; title: string; covers: string; strength: string; weakness: string }[];
  commonSkeleton: string[];
  gaps: { coverage: string[]; depth: string[]; experience: string[] };
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
          <div className="card">
            <div className="card-hd"><h3>Top competitors</h3><span className="chip ghost" style={{ fontSize: 11 }}>representative</span></div>
            {comp.competitors.map((c, i) => (
              <div key={i} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span className="mono muted" style={{ fontSize: 12, width: 20 }}>{i + 1}</span>
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14, color: "var(--purple)" }}>{c.title}</a>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 3, wordBreak: "break-all" }}>{c.url}</div>
                {c.covers && <div style={{ fontSize: 13, marginTop: 5 }}>{c.covers}</div>}
                {c.weakness && <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--soft)" }}><strong style={{ color: "var(--ink)" }}>Weakness:</strong> {c.weakness}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card-hd"><h3>Gap analysis</h3></div>
              {([["Coverage gap", comp.gaps?.coverage], ["Depth gap", comp.gaps?.depth], ["Experience gap", comp.gaps?.experience]] as const).map(([label, items]) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>{(items || []).map((g, i) => <li key={i} className="muted" style={{ fontSize: 13, marginBottom: 3 }}>{g}</li>)}</ul>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-hd"><h3>Common skeleton</h3></div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>{(comp.commonSkeleton || []).map((h, i) => <li key={i} style={{ fontSize: 13.5, marginBottom: 4 }}>{h}</li>)}</ul>
              {comp.whatToBeat && (
                <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--purple-soft)", borderRadius: 10 }}>
                  <div className="eyebrow accent" style={{ marginBottom: 4 }}>What to beat</div>
                  <div style={{ fontSize: 13.5 }}>{comp.whatToBeat}</div>
                </div>
              )}
              {comp.aiOverviewSnapshot && (
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--soft)" }}><strong style={{ color: "var(--ink)" }}>AI Overview:</strong> {comp.aiOverviewSnapshot}</div>
              )}
            </div>
          </div>
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
