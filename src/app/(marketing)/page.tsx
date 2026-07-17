import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { Icon } from "@/components/Icon";

export default function Landing() {
  return (
    <div style={{ background: "var(--canvas)" }}>
      {/* ── top nav ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "color-mix(in srgb, var(--canvas) 88%, transparent)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--black)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>S</span>
            <strong style={{ fontWeight: 700, letterSpacing: "-0.2px", fontSize: 17 }}>SEO Studio</strong>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <Link href="#modules" className="muted" style={{ fontSize: 14, fontWeight: 500 }}>Modules</Link>
            <Link href="#geo" className="muted" style={{ fontSize: 14, fontWeight: 500 }}>GEO framework</Link>
            <Link href="#pricing" className="muted" style={{ fontSize: 14, fontWeight: 500 }}>Pricing</Link>
            <Link href="/authority" className="btn" style={{ padding: "10px 18px" }}>Get started</Link>
          </nav>
        </div>
      </header>

      {/* ── hero ── */}
      <section className="container" style={{ textAlign: "center", padding: "90px 24px 70px" }}>
        <span className="chip" style={{ marginBottom: 26 }}>
          <Icon name="sparkle" size={14} className="" /> Built on Google Gemini · SEO + GEO + AEO
        </span>
        <h1 className="h-display" style={{ fontSize: "clamp(2.6rem, 6vw, 4.6rem)", maxWidth: 900, margin: "0 auto" }}>
          Content that ranks<br />and gets cited by AI.
        </h1>
        <p className="muted" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: 620, margin: "22px auto 0", lineHeight: 1.5 }}>
          A content strategy for anyone who wants to write <strong>semantically-mapped</strong> content —
          research the queries, build topical authority, and produce content that ranks on Google
          <em>and</em> gets cited by ChatGPT, Perplexity and AI Overviews.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 34, flexWrap: "wrap" }}>
          <Link href="/authority" className="btn">Build your topical map <Icon name="arrow" size={16} /></Link>
          <Link href="#modules" className="btn-outline">Explore the modules</Link>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 18 }}>Query research → topical authority → content that ranks and gets cited</p>
      </section>

      {/* ── how it works ── */}
      <section className="container" style={{ paddingBottom: 30 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {[
            ["01", "Research", "Query research → the real queries and search intents behind your topic."],
            ["02", "Authority", "Build an editable topical map — pillars, clusters, ontology and gaps — to own the whole topic."],
            ["03", "Produce", "Generate content engineered to rank and get cited: direct answers, quotable stats, FAQ schema."],
          ].map(([n, t, d]) => (
            <div key={n} className="card" style={{ padding: 22 }}>
              <span className="mono muted" style={{ fontSize: 13 }}>{n}</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 8px" }}>{t}</h3>
              <p className="muted" style={{ fontSize: 14 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── modules ── */}
      <section id="modules" className="container" style={{ padding: "70px 24px" }}>
        <p className="eyebrow accent">The workbench</p>
        <h2 className="h-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: 10, maxWidth: 640 }}>
          Every module, one topical workflow
        </h2>
        <p className="muted" style={{ fontSize: 16, marginTop: 12, maxWidth: 560 }}>
          Research → topical authority → content that ranks. Each module is a step toward owning your topic.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginTop: 30 }}>
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="card" style={{ display: "block", transition: "border-color .18s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--purple-soft)", color: "var(--purple)", display: "grid", placeItems: "center" }}>
                  <Icon name={m.icon} size={19} />
                </span>
                <span className={`badge ${m.status === "live" ? "med" : "low"}`}>{m.status === "live" ? "Live" : "Soon"}</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>{m.name}</h3>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{m.blurb}</p>
              <span className="accent" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--purple)", fontSize: 13, fontWeight: 600, marginTop: 14 }}>
                Open <Icon name="arrow" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── GEO framework ── */}
      <section id="geo" style={{ background: "var(--nav)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ padding: "70px 24px" }}>
          <p className="eyebrow accent">Why GEO</p>
          <h2 className="h-display" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", marginTop: 10, maxWidth: 620 }}>
            The 5 GEO pillars, all required
          </h2>
          <p className="muted" style={{ fontSize: 15, marginTop: 12, maxWidth: 560 }}>
            AI answers pull from five stacked signals. Skip one and you lose the citation. SEO Studio audits and writes against all five.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 26 }}>
            {[
              ["Crawlability", "Bots allowed, fast, clean HTML"],
              ["Structured data", "Article, FAQ, HowTo, Org schema"],
              ["Entity", "Person schema, sameAs ×5+"],
              ["Corroboration", "Wikipedia, press, .edu/.gov"],
              ["Content quality", "1 citable claim per H2"],
            ].map(([t, d], i) => (
              <div key={t} className="card" style={{ padding: 16 }}>
                <span className="mono muted" style={{ fontSize: 12 }}>{`0${i + 1}`}</span>
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: "8px 0 6px" }}>{t}</h4>
                <p className="muted" style={{ fontSize: 12.5 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── pricing ── */}
      <section id="pricing" className="container" style={{ padding: "70px 24px" }}>
        <p className="eyebrow accent">Pricing</p>
        <h2 className="h-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: 10 }}>Start with a 7-day trial</h2>
        <p className="muted" style={{ fontSize: 16, marginTop: 12, maxWidth: 560 }}>Card required · limited credits to try · cancel anytime within 7 days.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 30 }}>
          {[
            { name: "Starter", price: 19, credits: "100 credits · ~14 articles / mo", feats: ["1 project", "All modules", "Gemini-powered"], pro: false },
            { name: "Pro", price: 49, credits: "400 credits · ~55 articles / mo", feats: ["5 projects", "Priority generation", "Everything in Starter"], pro: true },
            { name: "Agency", price: 99, credits: "1,200 credits · ~170 articles / mo", feats: ["Unlimited clients", "Multi-client workspace", "Everything in Pro"], pro: false },
          ].map((p) => (
            <div key={p.name} className="card" style={{ padding: 24, borderColor: p.pro ? "var(--purple)" : "var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={p.pro ? "eyebrow accent" : "eyebrow"}>{p.name}</span>
                {p.pro && <span className="badge med">Popular</span>}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", margin: "12px 0 2px" }}>${p.price}<span style={{ fontSize: 15, fontWeight: 400, color: "var(--soft)" }}> /mo</span></div>
              <div className="muted" style={{ fontSize: 13 }}>{p.credits}</div>
              <hr className="hairline" style={{ margin: "16px 0" }} />
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 2.1 }}>{p.feats.map((f) => <div key={f}>{f}</div>)}</div>
              <Link href="/authority" className={p.pro ? "btn" : "btn-outline"} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>Start 7-day trial</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <h2 className="h-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>See it on your own site.</h2>
        <p className="muted" style={{ fontSize: 16, marginTop: 14, maxWidth: 480, margin: "14px auto 0" }}>
          Paste a URL and get a full SEO / GEO / AEO report in under a minute.
        </p>
        <Link href="/audit" className="btn" style={{ marginTop: 28 }}>Audit your site <Icon name="arrow" size={16} /></Link>
      </section>

      {/* ── footer ── */}
      <footer style={{ borderTop: "1px solid var(--line)" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px 24px", flexWrap: "wrap", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--black)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>S</span>
            <strong style={{ fontWeight: 700 }}>SEO Studio</strong>
          </span>
          <span className="muted" style={{ fontSize: 13 }}>SEO + GEO + AEO workbench · built on Claude</span>
        </div>
      </footer>
    </div>
  );
}
