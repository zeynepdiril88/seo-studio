"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

type Support = { title: string; queryType: string; entity: string; covered?: boolean };
type Cluster = { title: string; entity: string; support: Support[] };
type Pillar = { title: string; entity: string; clusters: Cluster[] };
type Edge = { from: string; relation: string; to: string };
type TopMap = {
  centralEntity: string;
  sourceContext: string;
  centralSearchIntent: string;
  pillars: Pillar[];
  ontology: Edge[];
  gaps: { coverage: string[]; depth: string[]; experience: string[] };
  researchSuggestions: { keyword: string; intent: string; why: string }[];
  internalLinks: { from: string; to: string; anchor: string }[];
  qualityNodes: { title: string; why: string }[];
  entityReinforcement: { entity: string; source: string; why: string }[];
  rankingSignalTransition: { phase: string; publish: string; why: string }[];
  pruning: { page: string; action: string; why: string }[];
};

const QTYPES = ["Definition", "Problem", "Solution", "Comparison", "Beginner"];
const QT: Record<string, string> = { Definition: "b-med", Problem: "b-high", Solution: "b-med", Comparison: "b-low", Beginner: "b-low" };

function EditText({ value, onChange, style, placeholder }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties; placeholder?: string }) {
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "2px 6px", font: "inherit", color: "inherit", width: "100%", minWidth: 60, ...style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--purple)"; e.currentTarget.style.background = "var(--surface)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
    />
  );
}

function Del({ onClick, title }: { onClick: () => void; title: string }) {
  return <button onClick={onClick} title={title} aria-label={title} style={{ color: "var(--mute)", fontSize: 17, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}>×</button>;
}

export default function AuthorityPage() {
  const [seed, setSeed] = useState("");
  const [ctx, setCtx] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [sources, setSources] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [map, setMap] = useState<TopMap | null>(null);

  function mutate(fn: (m: TopMap) => void) {
    setMap((prev) => { if (!prev) return prev; const m = structuredClone(prev); fn(m); return m; });
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!seed.trim() || loading) return;
    setLoading(true); setError(""); setMap(null);
    try {
      const res = await fetch("/api/authority", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed, sourceContext: ctx, siteUrl, sources }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setMap(data as TopMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 36px 60px" }}>
      <p className="eyebrow accent">Topical Authority</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>Build the topical map</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 640 }}>
        A central entity becomes a semantic knowledge architecture — taxonomy, ontology and gaps.
        The map is Claude&apos;s suggestion; <strong style={{ color: "var(--ink)" }}>edit it freely</strong> — rename, add or remove any node — then send a node to an outline.
      </p>

      <form onSubmit={run} style={{ display: "grid", gap: 10, marginTop: 22, maxWidth: 720 }}>
        <input className="field" placeholder="Central entity / seed — e.g. nervous system regulation" value={seed} onChange={(e) => setSeed(e.target.value)} spellCheck={false} />
        <input className="field" placeholder="Source context (optional) — e.g. a wellness brand selling somatic courses" value={ctx} onChange={(e) => setCtx(e.target.value)} spellCheck={false} />
        <input className="field" placeholder="Your site URL (optional) — analyze current coverage & find the gaps" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} spellCheck={false} />
        <textarea className="field" placeholder="Your own sources / book excerpts (optional) — the map is grounded in these and fills the gaps" value={sources} onChange={(e) => setSources(e.target.value)} rows={4} style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
        <button className="btn" disabled={loading} style={{ justifySelf: "start" }}>
          {loading ? <><span className="spin" /> Building…</> : <>Build map <span className="sub">1 credit</span></>}
        </button>
      </form>

      {error && <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>{error}</span></div>}
      {loading && !map && <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Designing the taxonomy, ontology and gaps — ~30–50 seconds.</p>}

      {map && (
        <div className="reveal" style={{ marginTop: 28 }}>
          <div className="card" style={{ borderColor: "var(--purple)", background: "var(--purple-soft)" }}>
            <div className="eyebrow accent">Central search intent</div>
            <EditText value={map.centralSearchIntent} onChange={(v) => mutate((m) => { m.centralSearchIntent = v; })} style={{ fontSize: 16, fontWeight: 600, marginTop: 6, marginLeft: -6 }} />
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}><strong>Entity:</strong> {map.centralEntity} &nbsp;·&nbsp; <strong>Source context:</strong> {map.sourceContext}</p>
          </div>

          {/* at-a-glance summary — makes the scale of the map legible */}
          {(() => {
            const clusters = map.pillars.reduce((a, p) => a + p.clusters.length, 0);
            const queries = map.pillars.reduce((a, p) => a + p.clusters.reduce((b, c) => b + c.support.length, 0), 0);
            const covered = map.pillars.reduce((a, p) => a + p.clusters.reduce((b, c) => b + c.support.filter((s) => s.covered).length, 0), 0);
            const gapCount = (map.gaps.coverage?.length || 0) + (map.gaps.depth?.length || 0) + (map.gaps.experience?.length || 0);
            const stats: [number, string][] = [
              [map.pillars.length, "pillars"],
              [clusters, "clusters"],
              [queries, "target queries"],
              [gapCount, "gaps to fill"],
              [map.internalLinks.length, "internal links"],
            ];
            if (covered > 0) stats.splice(3, 0, [covered, "already covered"]);
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                {stats.map(([n, label]) => (
                  <div key={label} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "baseline", gap: 8, flex: "1 1 auto", minWidth: 110 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>{n}</span>
                    <span className="muted" style={{ fontSize: 12.5 }}>{label}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* editable topical map */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "26px 0 4px", flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Topical map</h2>
            <span className="muted" style={{ fontSize: 12.5 }}>Click to rename · + add · × remove · <span style={{ color: "var(--purple)" }}>●</span> covered <span style={{ color: "var(--pink)" }}>●</span> gap</span>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 12px", maxWidth: 680, lineHeight: 1.5 }}>
            <strong style={{ color: "var(--ink)" }}>Pillars</strong> are the big hub pages, <strong style={{ color: "var(--ink)" }}>clusters</strong> are their subtopics, and each row is a real <strong style={{ color: "var(--ink)" }}>query</strong> to write a page for. Click any query&apos;s <span style={{ color: "var(--purple)" }}>Outline →</span> to turn it into an article.
          </p>

          <div style={{ display: "grid", gap: 14 }}>
            {map.pillars.map((p, pi) => (
              <div key={pi} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge b-med">Pillar</span>
                  <EditText value={p.title} onChange={(v) => mutate((m) => { m.pillars[pi].title = v; })} style={{ fontWeight: 700, fontSize: 16 }} />
                  <EditText value={p.entity} onChange={(v) => mutate((m) => { m.pillars[pi].entity = v; })} placeholder="entity" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--soft)", maxWidth: 220 }} />
                  <Del onClick={() => mutate((m) => { m.pillars.splice(pi, 1); })} title="Remove pillar" />
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                  {p.clusters.map((c, ci) => (
                    <div key={ci} style={{ borderLeft: "2px solid var(--line)", paddingLeft: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="badge b-low">Cluster</span>
                        <EditText value={c.title} onChange={(v) => mutate((m) => { m.pillars[pi].clusters[ci].title = v; })} style={{ fontWeight: 600, fontSize: 14.5 }} />
                        <Del onClick={() => mutate((m) => { m.pillars[pi].clusters.splice(ci, 1); })} title="Remove cluster" />
                      </div>
                      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                        {c.support.map((s, si) => (
                          <div key={si} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--nav)", borderRadius: 8, border: "1px solid var(--line)" }}>
                            <span title={s.covered ? "Already covered on your site" : "Gap — not yet covered"} style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: s.covered ? "var(--purple)" : "var(--pink)" }} />
                            <select
                              value={s.queryType}
                              onChange={(e) => mutate((m) => { m.pillars[pi].clusters[ci].support[si].queryType = e.target.value; })}
                              style={{ font: "inherit", fontSize: 11, fontWeight: 700, color: "var(--purple)", background: "var(--purple-soft)", border: "none", borderRadius: 6, padding: "3px 4px", flexShrink: 0 }}
                            >
                              {QTYPES.map((q) => <option key={q} value={q}>{q}</option>)}
                            </select>
                            <EditText value={s.title} onChange={(v) => mutate((m) => { m.pillars[pi].clusters[ci].support[si].title = v; })} style={{ fontSize: 13.5 }} />
                            <Link href={"/write?q=" + encodeURIComponent(s.title)} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>Outline <Icon name="arrow" size={14} /></Link>
                            <Del onClick={() => mutate((m) => { m.pillars[pi].clusters[ci].support.splice(si, 1); })} title="Remove query" />
                          </div>
                        ))}
                        <button onClick={() => mutate((m) => { m.pillars[pi].clusters[ci].support.push({ title: "New query", queryType: "Solution", entity: "" }); })} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, textAlign: "left", padding: "2px 0" }}>+ query</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => mutate((m) => { m.pillars[pi].clusters.push({ title: "New cluster", entity: "", support: [] }); })} style={{ color: "var(--purple)", fontSize: 13, fontWeight: 600, textAlign: "left" }}>+ cluster</button>
                </div>
              </div>
            ))}
            <button onClick={() => mutate((m) => { m.pillars.push({ title: "New pillar", entity: "", clusters: [] }); })} className="btn-outline" style={{ justifyContent: "center" }}>+ Add pillar</button>
          </div>

          {map.researchSuggestions?.length ? (
            <div className="card" style={{ marginTop: 16, borderColor: "var(--purple)" }}>
              <div className="card-hd"><h3>Research next — keywords for the gaps</h3><span className="muted" style={{ fontSize: 12 }}>keyword · search intent</span></div>
              {map.researchSuggestions.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.keyword}</span>
                  <span className="badge b-med">{r.intent}</span>
                  <span className="muted" style={{ fontSize: 13, flex: 1, minWidth: 180 }}>{r.why}</span>
                  <Link href={"/write?q=" + encodeURIComponent(r.keyword)} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>Outline <Icon name="arrow" size={14} /></Link>
                </div>
              ))}
            </div>
          ) : null}

          {/* insights (read-only reference) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 20 }}>
            <div className="card">
              <div className="card-hd"><h3>Ontology — how concepts connect</h3></div>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>The semantic web behind the topic. Each line is <em>concept → relationship → concept</em> — an internal-link path to build and a signal of depth that helps Google and AI engines trust your coverage.</p>
              {map.ontology.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "6px 0", fontSize: 13.5, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600 }}>{e.from}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--purple)" }}>{e.relation}</span>
                  <span className="muted">{e.to}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-hd"><h3>Gap analysis</h3></div>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>What&apos;s missing for full authority. <strong>Coverage</strong> = subtopics you don&apos;t cover yet · <strong>Depth</strong> = where to go deeper · <strong>Experience</strong> = original frameworks only you can add.</p>
              {([["Coverage gap", map.gaps.coverage], ["Depth gap", map.gaps.depth], ["Experience gap", map.gaps.experience]] as const).map(([label, items]) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {items.map((g, i) => <li key={i} className="muted" style={{ fontSize: 13, marginBottom: 3 }}>{g}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-hd"><h3>Internal linking</h3><span className="muted" style={{ fontSize: 12 }}>hub-and-spoke</span></div>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>The link plan: clusters link up to their pillar (the hub), plus lateral links between related topics. Use the exact <strong>anchor text</strong> — descriptive, never &ldquo;click here.&rdquo;</p>
              {map.internalLinks.map((l, i) => (
                <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 13 }}>
                  <span className="muted">{l.from}</span> <span className="mono" style={{ color: "var(--purple)" }}>→</span> <span className="muted">{l.to}</span>
                  <div style={{ marginTop: 3 }}>anchor: <span style={{ fontWeight: 600 }}>“{l.anchor}”</span></div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-hd"><h3>Quality nodes</h3></div>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>Your flagship pages. Publish these first — they define the topic and every other page links back to them.</p>
              {map.qualityNodes.map((q, i) => (
                <div key={i} style={{ padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{q.title}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{q.why}</div>
                </div>
              ))}
            </div>
            {map.entityReinforcement?.length ? (
              <div className="card">
                <div className="card-hd"><h3>Entity reinforcement</h3><span className="muted" style={{ fontSize: 12 }}>knowledge-graph corroboration</span></div>
                <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>Authoritative outside sources to cite and link. They corroborate your topic and tie your site into the knowledge graph that Google and AI engines trust.</p>
                {map.entityReinforcement.map((e, i) => (
                  <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{e.entity} <span className="mono" style={{ color: "var(--purple)", fontWeight: 400, fontSize: 12 }}>· {e.source}</span></div>
                    <div className="muted" style={{ marginTop: 3 }}>{e.why}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {map.rankingSignalTransition?.length ? (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-hd"><h3>Ranking signal transition</h3><span className="muted" style={{ fontSize: 12 }}>publish in this order to build authority</span></div>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 12px", lineHeight: 1.5 }}>Order matters. Publishing in these phases tells search engines you cover the topic completely before you chase competitive terms — that&apos;s how coverage turns into rankings.</p>
              <div style={{ display: "grid", gap: 12, marginTop: 4 }}>
                {map.rankingSignalTransition.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                    <span className="mono" style={{ color: "var(--purple)", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.phase} — <span style={{ fontWeight: 500 }}>{p.publish}</span></div>
                      <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{p.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {map.pruning?.length ? (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-hd"><h3>Content pruning</h3><span className="muted" style={{ fontSize: 12 }}>from your existing site</span></div>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>Weak or overlapping pages already on your site drag the whole topic down. <strong>Prune</strong> = remove, <strong>merge</strong> = combine, <strong>update</strong> = refresh.</p>
              {map.pruning.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "9px 0", borderTop: i ? "1px solid var(--line)" : "none", flexWrap: "wrap" }}>
                  <span className={"badge " + (p.action === "prune" ? "b-high" : p.action === "merge" ? "b-med" : "b-low")}>{p.action}</span>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.page}</span>
                  <span className="muted" style={{ fontSize: 13, flex: 1, minWidth: 180 }}>{p.why}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
