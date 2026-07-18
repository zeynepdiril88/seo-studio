"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildSchema, type SchemaOutline } from "@/lib/schema";

type Outline = SchemaOutline & { relatedEntities: string[]; faq: { q: string; a: string }[] };

function SchemaInner() {
  const sp = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outline, setOutline] = useState<Outline | null>(null);

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

  const schema = outline ? buildSchema(outline) : "";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "30px 36px 60px" }}>
      <p className="eyebrow accent">Intelligence · Entity Schema</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>Entity schema generator</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 640, lineHeight: 1.55 }}>
        Enter a topic. We derive its entities and generate copy-ready JSON-LD — an Article that declares its
        main entity and related entities, an author, and a FAQPage — so Google and AI engines recognize what your page is about.
      </p>

      <form onSubmit={run} style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <input className="field" placeholder="A topic / page subject — e.g. how to lower cortisol naturally" value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false} />
        <button className="btn" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <><span className="spin" /> Building…</> : <>Generate schema <span className="sub">1 credit</span></>}
        </button>
      </form>

      {error && <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}><span style={{ color: "#a13a26", fontSize: 14 }}>{error}</span></div>}
      {loading && !outline && <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Deriving the entities and building the schema — ~15–30 seconds.</p>}

      {outline && (
        <div className="reveal" style={{ marginTop: 28 }}>
          <div className="card">
            <div className="card-hd"><h3>Entities detected</h3></div>
            <div style={{ marginBottom: 10 }}>
              <span className="eyebrow" style={{ marginRight: 8 }}>Main</span>
              <span className="chip">{outline.mainEntity}</span>
            </div>
            {outline.relatedEntities?.length ? (
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Related</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {outline.relatedEntities.map((e) => <span key={e} className="chip">{e}</span>)}
                </div>
              </div>
            ) : null}
          </div>

          <div className="card" style={{ marginTop: 16, borderColor: "var(--purple)" }}>
            <div className="card-hd">
              <h3>Schema markup (JSON-LD)</h3>
              <button className="mono" onClick={() => navigator.clipboard?.writeText(schema)} style={{ fontSize: 11, color: "var(--purple)", fontWeight: 600 }}>Copy</button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>
              Paste into the page&apos;s <code>&lt;head&gt;</code>. Includes an <code>Article</code> with <code>about</code>/<code>mentions</code> entities,
              an author <code>Person</code>, and a <code>FAQPage</code>.
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
