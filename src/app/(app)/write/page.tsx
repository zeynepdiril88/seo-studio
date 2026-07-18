"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Section = { h2: string; directAnswer: string; keyPoints: string[]; subsections: string[]; entities: string[] };
type Outline = {
  title: string;
  mainEntity: string;
  relatedEntities: string[];
  userIntent: string;
  funnelStage: string;
  targetWordCount: number;
  isQualityNode: boolean;
  strategy: string;
  sections: Section[];
  internalLinks: { anchor: string; target: string }[];
  externalRefs: { label: string; type: string }[];
  faq: { q: string; a: string }[];
  eeatSignals?: { experience: string; expertise: string; authoritativeness: string; trust: string[] };
};

// Build copy-ready JSON-LD entity schema from the outline: an Article that declares its main
// entity (about) and related entities (mentions), an author Person (E-E-A-T), and a FAQPage.
function buildSchema(o: Outline): string {
  const today = new Date().toISOString().slice(0, 10);
  const entities = [o.mainEntity, ...(o.relatedEntities || [])].filter(Boolean);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: o.title,
      description: o.userIntent,
      about: { "@type": "Thing", name: o.mainEntity },
      mentions: (o.relatedEntities || []).map((e) => ({ "@type": "Thing", name: e })),
      author: {
        "@type": "Person",
        name: "Author Name",
        ...(o.eeatSignals?.expertise ? { description: o.eeatSignals.expertise } : {}),
        knowsAbout: entities,
      },
      datePublished: today,
      dateModified: today,
    },
  ];
  if (o.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: o.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function EditText({ value, onChange, style, placeholder }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties; placeholder?: string }) {
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "3px 7px", font: "inherit", color: "inherit", width: "100%", ...style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--purple)"; e.currentTarget.style.background = "var(--surface)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
    />
  );
}

function WriteInner() {
  const sp = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outline, setOutline] = useState<Outline | null>(null);
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [instructions, setInstructions] = useState("");

  function mutate(fn: (o: Outline) => void) {
    setOutline((prev) => { if (!prev) return prev; const o = structuredClone(prev); fn(o); return o; });
  }

  useEffect(() => {
    const q = sp.get("q");
    if (q) setQuery(q);
  }, [sp]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true); setError(""); setOutline(null);
    try {
      const res = await fetch("/api/outline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setOutline(data as Outline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function genDraft() {
    if (!outline || drafting) return;
    setDrafting(true); setDraftError(""); setDraft("");
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outline, instructions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setDraft(data.markdown || "");
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "30px 36px 60px" }}>
      <p className="eyebrow accent">Content Writing</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>Outline first</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 620 }}>
        Before any prose, generate the full content outline from the query — main entity, related entities,
        direct-answer blocks, internal links and FAQ. Every rule applied.
      </p>

      <form onSubmit={run} style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <input className="field" placeholder="The query this page targets — e.g. how to regulate the nervous system" value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false} />
        <button className="btn" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spin" /> Building…</> : <>Generate outline <span className="sub">1 credit</span></>}
        </button>
      </form>

      {error && <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>{error}</span></div>}
      {loading && !outline && <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Deriving entities, intent and the section-by-section outline — ~20–40 seconds.</p>}

      {outline && (
        <div className="reveal" style={{ marginTop: 28 }}>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <span className="eyebrow accent">Working title (H1) · click to edit</span>
              {outline.isQualityNode && <span className="badge b-med">Quality node</span>}
            </div>
            <EditText value={outline.title} onChange={(v) => mutate((o) => { o.title = v; })} style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px", marginLeft: -7 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              <span className="chip">Main entity: {outline.mainEntity}</span>
              <span className="chip ghost">{outline.funnelStage}</span>
              <span className="chip ghost mono">~{outline.targetWordCount} words</span>
            </div>
            {outline.relatedEntities?.length ? (
              <div style={{ marginTop: 12 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Related entities</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {outline.relatedEntities.map((e) => <span key={e} className="chip">{e}</span>)}
                </div>
              </div>
            ) : null}
            <p className="muted" style={{ fontSize: 13.5, marginTop: 14, lineHeight: 1.6 }}><strong style={{ color: "var(--ink)" }}>Intent:</strong> {outline.userIntent}</p>
            {outline.strategy && <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}><strong style={{ color: "var(--ink)" }}>Strategy:</strong> {outline.strategy}</p>}
          </div>

          {/* sections */}
          <div style={{ marginTop: 16 }}>
            {outline.sections.map((s, i) => (
              <div key={i} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="mono muted" style={{ fontSize: 13, flexShrink: 0 }}>H2</span>
                  <EditText value={s.h2} onChange={(v) => mutate((o) => { o.sections[i].h2 = v; })} style={{ fontSize: 17, fontWeight: 700 }} />
                  <button onClick={() => mutate((o) => { o.sections.splice(i, 1); })} title="Remove section" style={{ color: "var(--mute)", fontSize: 17, padding: "0 4px", flexShrink: 0 }}>×</button>
                </div>
                {s.directAnswer && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--purple-soft)", borderRadius: 8, fontSize: 13.5, lineHeight: 1.5 }}>
                    <span className="eyebrow accent" style={{ display: "block", marginBottom: 4 }}>Direct answer (GEO)</span>
                    {s.directAnswer}
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Key aspects</div>
                  {(s.keyPoints ?? []).map((k, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mono muted" style={{ fontSize: 13, flexShrink: 0 }}>•</span>
                      <EditText value={k} onChange={(v) => mutate((o) => { o.sections[i].keyPoints[j] = v; })} style={{ fontSize: 13.5 }} />
                      <button onClick={() => mutate((o) => { o.sections[i].keyPoints.splice(j, 1); })} title="Remove" style={{ color: "var(--mute)", fontSize: 15, padding: "0 4px", flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => mutate((o) => { o.sections[i].keyPoints = [...(o.sections[i].keyPoints ?? []), "New key aspect"]; })} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>+ key aspect</button>
                </div>
                {s.subsections?.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {s.subsections.map((h3, j) => <span key={j} className="chip ghost"><span className="mono" style={{ fontSize: 10 }}>H3</span> {h3}</span>)}
                  </div>
                ) : null}
              </div>
            ))}
            <button onClick={() => mutate((o) => { o.sections.push({ h2: "New section", directAnswer: "", keyPoints: [], subsections: [], entities: [] }); })} className="btn-outline" style={{ justifyContent: "center", width: "100%" }}>+ Add H2 section</button>
          </div>

          {/* links + refs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
            <div className="card">
              <div className="card-hd"><h3>Internal links</h3></div>
              {outline.internalLinks.map((l, i) => (
                <div key={i} style={{ padding: "7px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 13.5 }}>
                  <span style={{ fontWeight: 600 }}>“{l.anchor}”</span> <span className="mono muted" style={{ fontSize: 11 }}>→</span> <span className="muted">{l.target}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-hd"><h3>External references</h3></div>
              {outline.externalRefs.map((r, i) => (
                <div key={i} style={{ padding: "7px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 13.5 }}>
                  <span style={{ fontWeight: 600 }}>{r.label}</span> <span className="muted">· {r.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd"><h3>FAQ</h3><span className="muted" style={{ fontSize: 12 }}>FAQPage schema-ready</span></div>
            {outline.faq.map((f, i) => (
              <div key={i} style={{ padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.q}</div>
                <div className="muted" style={{ fontSize: 13.5, marginTop: 3, lineHeight: 1.5 }}>{f.a}</div>
              </div>
            ))}
          </div>

          {/* E-E-A-T signals */}
          {outline.eeatSignals && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-hd"><h3>E-E-A-T signals</h3><span className="muted" style={{ fontSize: 12 }}>authority the draft is written to carry</span></div>
              {([["Experience", outline.eeatSignals.experience], ["Expertise", outline.eeatSignals.expertise], ["Authoritativeness", outline.eeatSignals.authoritativeness]] as const).map(([label, val], i) => (
                <div key={label} style={{ padding: "9px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <span className="eyebrow accent" style={{ display: "block", marginBottom: 3 }}>{label}</span>
                  <span className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{val}</span>
                </div>
              ))}
              {outline.eeatSignals.trust?.length ? (
                <div style={{ padding: "9px 0", borderTop: "1px solid var(--line)" }}>
                  <span className="eyebrow accent" style={{ display: "block", marginBottom: 6 }}>Trustworthiness — primary sources</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {outline.eeatSignals.trust.map((t) => <span key={t} className="chip">{t}</span>)}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* entity schema (JSON-LD) */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd">
              <h3>Entity schema (JSON-LD)</h3>
              <button className="mono" onClick={() => navigator.clipboard?.writeText(buildSchema(outline))} style={{ fontSize: 11, color: "var(--purple)", fontWeight: 600 }}>Copy</button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>
              Structured data built from this outline — the main entity (<code>about</code>), related entities
              (<code>mentions</code>), the author, and the FAQ. Paste it into the page&apos;s <code>&lt;head&gt;</code> so
              Google and AI engines recognize your entities.
            </p>
            <pre style={{ overflowX: "auto", background: "var(--nav)", border: "1px solid var(--line)", borderRadius: 10, padding: 14, fontSize: 12, lineHeight: 1.5, fontFamily: "var(--mono)", margin: 0 }}>{buildSchema(outline)}</pre>
          </div>

          <div className="card" style={{ marginTop: 20, borderColor: "var(--purple)" }}>
            <label className="eyebrow accent" style={{ display: "block", marginBottom: 8 }}>Instructions for the writer (optional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Tell the writer how to write it — e.g. ~1500 words · more conversational · lead with a real example · keep the H1 I set above · add a comparison table"
              rows={2}
              className="field"
              style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn" onClick={genDraft} disabled={drafting}>
                {drafting ? <><span className="spin" /> Writing…</> : draft ? <>Rewrite draft <span className="sub">3 credits</span></> : <>Write full draft <span className="sub">3 credits</span></>}
              </button>
              <span className="muted" style={{ fontSize: 13 }}>Edit the H1, H2s or key aspects above, add instructions, then {draft ? "rewrite" : "write"}.</span>
            </div>
          </div>

          {draftError && <div className="card" style={{ marginTop: 14, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>{draftError}</span></div>}
          {drafting && !draft && <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>Writing the full article from the outline — ~20–40 seconds.</p>}

          {draft && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-hd">
                <h3>Draft</h3>
                <span className="muted" style={{ fontSize: 12 }}>{draft.trim().split(/\s+/).filter(Boolean).length} words · editable</span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck
                style={{ width: "100%", minHeight: 520, border: "1px solid var(--line)", borderRadius: 10, padding: 16, fontSize: 14.5, lineHeight: 1.7, fontFamily: "inherit", color: "var(--ink)", background: "var(--surface)", resize: "vertical", outline: "none" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button className="btn-outline" onClick={() => navigator.clipboard?.writeText(draft)}>Copy markdown</button>
                <button className="btn-outline" onClick={genDraft} disabled={drafting}>Regenerate</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div style={{ padding: 36 }} className="muted">Loading…</div>}>
      <WriteInner />
    </Suspense>
  );
}
