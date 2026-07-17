import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { Icon } from "@/components/Icon";

export function ComingSoon({ href }: { href: string }) {
  const m = MODULES.find((x) => x.href === href);
  if (!m) return null;
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 36px" }}>
      <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--purple-soft)", color: "var(--purple)", display: "grid", placeItems: "center" }}>
        <Icon name={m.icon} size={23} />
      </span>
      <p className="eyebrow accent" style={{ marginTop: 20 }}>{m.group}</p>
      <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>{m.name}</h1>
      <p className="muted" style={{ fontSize: 15, marginTop: 10, maxWidth: 560, lineHeight: 1.55 }}>{m.blurb}</p>

      <div className="card" style={{ marginTop: 26 }}>
        <div className="card-hd"><h3>On the roadmap</h3><span className="badge low">Soon</span></div>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
          This module is specified in the product plan and is next in the build queue. The flagship
          <strong style={{ color: "var(--ink)" }}> Site Audit </strong>
          module is live now — it runs a full SEO / GEO / AEO analysis on any URL.
        </p>
        <Link href="/audit" className="btn" style={{ marginTop: 16 }}>Try Site Audit <Icon name="arrow" size={16} /></Link>
      </div>
    </div>
  );
}
