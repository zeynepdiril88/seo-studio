"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

type Status = "pass" | "warn" | "fail";
type Check = { label: string; status: Status; detail: string };
type Fix = { title: string; severity: "critical" | "high" | "medium" | "low"; impact: string; detail: string };
type Result = {
  site: string;
  scores: { seo: number; geo: number; aeo: number; overall: number };
  healthLabel: string;
  summary: string;
  meta: Check[];
  schema: { present: string[]; missing: string[] };
  geoChecks: Check[];
  aeoChecks: Check[];
  fixes: Fix[];
};

const SEV_CLASS: Record<Fix["severity"], string> = { critical: "crit", high: "high", medium: "med", low: "low" };

function Dot({ status }: { status: Status }) {
  const c = status === "pass" ? "var(--purple)" : status === "warn" ? "#c9a400" : "#c0472f";
  return <span style={{ width: 8, height: 8, borderRadius: 999, background: c, flexShrink: 0 }} />;
}

function CheckList({ title, items }: { title: string; items: Check[] }) {
  return (
    <div className="card">
      <div className="card-hd"><h3>{title}</h3></div>
      {items.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
          <span style={{ paddingTop: 5 }}><Dot status={c.status} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.label}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{c.detail}</div>
          </div>
        </div>
      ))}
    </div>
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

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 36px 60px" }}>
      <p className="eyebrow accent">Site &amp; Technical Audit</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>Audit any site for SEO, GEO &amp; AEO</h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 640 }}>
        Paste a URL. Claude fetches the page and scores it across search, generative-engine and answer-engine
        readiness — with a prioritized fix list.
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
          {loading ? <><span className="spin" /> Auditing…</> : <>Run audit <span className="sub">1 credit</span></>}
        </button>
      </form>

      {error && (
        <div className="card" style={{ marginTop: 18, borderColor: "#e6c3ba", background: "#faf1ee" }}>
          <span style={{ color: "#a13a26", fontSize: 14, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {loading && !result && (
        <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
          Fetching the page and running the 5-pillar GEO analysis — this takes ~20–40 seconds.
        </p>
      )}

      {result && (
        <div className="reveal" style={{ marginTop: 30 }}>
          {/* scores */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div className="tile" style={{ borderColor: "var(--purple)", background: "var(--purple-soft)" }}>
              <div className="label">Overall</div>
              <div className="value" style={{ color: "var(--purple)" }}>{result.scores.overall}</div>
              <div className="meta">{result.healthLabel}</div>
            </div>
            {(["seo", "geo", "aeo"] as const).map((k) => (
              <div key={k} className="tile">
                <div className="label" style={{ textTransform: "uppercase", letterSpacing: ".5px" }}>{k}</div>
                <div className="value">{result.scores[k]}</div>
                <div className="meta">out of 100</div>
              </div>
            ))}
          </div>

          {/* summary */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd"><h3>Executive summary</h3><span className="muted" style={{ fontSize: 12 }}>{result.site}</span></div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--soft)" }}>{result.summary}</p>
          </div>

          {/* checks grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
            <CheckList title="Meta & tags" items={result.meta} />
            <div className="card">
              <div className="card-hd"><h3>Structured data</h3></div>
              <div style={{ marginBottom: 12 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Present</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.schema.present.length ? result.schema.present.map((s) => <span key={s} className="chip">{s}</span>) : <span className="muted" style={{ fontSize: 13 }}>None found</span>}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Missing</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.schema.missing.map((s) => <span key={s} className="chip ghost">{s}</span>)}
                </div>
              </div>
            </div>
            <CheckList title="GEO — AI search readiness" items={result.geoChecks} />
            <CheckList title="AEO — answer engines" items={result.aeoChecks} />
          </div>

          {/* fixes */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-hd"><h3>Prioritized fix list</h3><span className="muted" style={{ fontSize: 12 }}>{result.fixes.length} actions</span></div>
            {result.fixes.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span className="mono muted" style={{ fontSize: 13, paddingTop: 2, width: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{f.title}</span>
                    <span className={`badge ${SEV_CLASS[f.severity]}`}>{f.severity}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>{f.detail}</div>
                  <div style={{ fontSize: 12.5, color: "var(--purple)", marginTop: 6, fontWeight: 500 }}>Impact: {f.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
