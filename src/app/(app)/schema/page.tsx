"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildSchema, type SchemaOutline } from "@/lib/schema";

type Outline = SchemaOutline & { relatedEntities: string[]; faq: { q: string; a: string }[] };

function EditText({ value, onChange, style, placeholder }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties; placeholder?: string }) {
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: "var(--nav)", border: "1px solid var(--line)", borderRadius: 7, padding: "5px 9px", font: "inherit", color: "inherit", width: "100%", ...style }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--purple)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
    />
  );
}

function SchemaInner() {
  const sp = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outline, setOutline] = useState<Outline | null>(null);
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    const q = sp.get("q");
    if (q) setQuery(q);
  }, [sp]);

  function mutate(fn: (o: Outline) => void) {
    setOutline((prev) => { if (!prev) return prev; const o = structuredClone(prev); fn(o); return o; });
  }

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

  const schema = outline ? buildSchema(outline, authorName) : "";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "30px 36px 60px" }}>
      <p className="eyebrow accent">Intelligence · Entity Schema</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>Entity schema generator</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 640, lineHeight: 1.55 }}>
        Enter a topic. We derive its entities and generate copy-ready JSON-LD — an Article that declares its
        main entity and related entities, an author, and a FAQPage. Edit anything below; the schema updates live.
      </p>

      <form onSubmit={run} style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <input className="field" placeholder="A topic / page subject — e.g. the mind body connection" value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false} />
        <button className="btn" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spin" /> Building…</> : <>Generate schema <span className="sub">1 credit</span></>}
        </button>
      </form>

      {error && <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>{error}</span></div>}
      {loading && !outline && <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Deriving the entities and building the schema — ~15–30 seconds.</p>}

      {outline && (
        <div className="reveal" style={{ marginTop: 28 }}>
          {/* entities — editable */}
          <div className="card">
            <div className="card-hd"><h3>Entities</h3><span className="muted" style={{ fontSize: 12 }}>edit · add · remove</span></div>
            <div style={{ marginBottom: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Main entity</div>
              <EditText value={outline.mainEntity} onChange={(v) => mutate((o) => { o.mainEntity = v; })} style={{ maxWidth: 360, fontWeight: 600 }} />
            </div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Related entities</div>
            <div style={{ display: "grid", gap: 6 }}>
              {outline.relatedEntities.map((ent, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 420 }}>
                  <EditText value={ent} onChange={(v) => mutate((o) => { o.relatedEntities[i] = v; })} />
                  <button onClick={() => mutate((o) => { o.relatedEntities.splice(i, 1); })} title="Remove" style={{ color: "var(--mute)", fontSize: 16, padding: "0 4px", flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
            <button onClick={() => mutate((o) => { o.relatedEntities.push(""); })} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>+ related entity</button>
          </div>

          {/* author — manual */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd"><h3>Author</h3><span className="muted" style={{ fontSize: 12 }}>for the Person entity</span></div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Author name</div>
            <EditText value={authorName} onChange={setAuthorName} placeholder="e.g. Dr. Jane Doe" style={{ maxWidth: 360 }} />
            {outline.eeatSignals?.expertise ? (
              <p className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}><strong style={{ color: "var(--ink)" }}>Expertise (description):</strong> {outline.eeatSignals.expertise}</p>
            ) : null}
          </div>

          {/* FAQ — editable */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd"><h3>FAQ</h3><span className="muted" style={{ fontSize: 12 }}>feeds the FAQPage schema · edit the questions</span></div>
            <div style={{ display: "grid", gap: 12 }}>
              {outline.faq.map((f, i) => (
                <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? 12 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="mono muted" style={{ fontSize: 12, flexShrink: 0 }}>Q</span>
                    <EditText value={f.q} onChange={(v) => mutate((o) => { o.faq[i].q = v; })} style={{ fontWeight: 600 }} />
                    <button onClick={() => mutate((o) => { o.faq.splice(i, 1); })} title="Remove" style={{ color: "var(--mute)", fontSize: 16, padding: "0 4px", flexShrink: 0 }}>×</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 5 }}>
                    <span className="mono muted" style={{ fontSize: 12, flexShrink: 0, paddingTop: 6 }}>A</span>
                    <textarea
                      value={f.a}
                      onChange={(e) => mutate((o) => { o.faq[i].a = e.target.value; })}
                      rows={2}
                      style={{ width: "100%", background: "var(--nav)", border: "1px solid var(--line)", borderRadius: 7, padding: "5px 9px", font: "inherit", fontSize: 13.5, lineHeight: 1.5, resize: "vertical", color: "var(--ink)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => mutate((o) => { o.faq.push({ q: "New question?", a: "" }); })} style={{ color: "var(--purple)", fontSize: 12.5, fontWeight: 600, marginTop: 10 }}>+ question</button>
          </div>

          {/* JSON-LD — live */}
          <div className="card" style={{ marginTop: 16, borderColor: "var(--purple)" }}>
            <div className="card-hd">
              <h3>Schema markup (JSON-LD)</h3>
              <button className="mono" onClick={() => navigator.clipboard?.writeText(schema)} style={{ fontSize: 11, color: "var(--purple)", fontWeight: 600 }}>Copy</button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>
              Live from your edits above. Paste into the page&apos;s <code>&lt;head&gt;</code>. Includes an <code>Article</code> with
              <code>about</code>/<code>mentions</code> entities, an author <code>Person</code>, and a <code>FAQPage</code>.
            </p>
            <pre style={{ overflowX: "auto", background: "var(--nav)", border: "1px solid var(--line)", borderRadius: 10, padding: 14, fontSize: 12, lineHeight: 1.5, fontFamily: "var(--mono)", margin: 0 }}>{schema}</pre>
          </div>

          <div style={{ marginTop: 20 }}>
            <a className="btn-outline" href={"/write?q=" + encodeURIComponent(query)}>Write the full article for this →</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchemaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 36 }} className="muted">Loading…</div>}>
      <SchemaInner />
    </Suspense>
  );
}
