"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES, type AppModule } from "@/lib/modules";
import { Icon } from "@/components/Icon";

const GROUPS: AppModule["group"][] = ["Site Health", "Research", "Content", "Intelligence"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const active = MODULES.find((m) => path === m.href || path.startsWith(m.href + "/"));

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--canvas)" }}>
      {/* ── icon rail ── */}
      <nav
        style={{
          width: 56,
          flexShrink: 0,
          background: "var(--rail)",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0",
          gap: 6,
        }}
      >
        <Link href="/" title="Home" style={{ width: 30, height: 30, borderRadius: 8, background: "var(--ink)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14, marginBottom: 6 }}>S</Link>
        {MODULES.map((m) => {
          const on = active?.href === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              title={m.name}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                color: on ? "var(--purple)" : "var(--mute)",
                background: on ? "var(--surface)" : "transparent",
                border: on ? "1px solid var(--line)" : "1px solid transparent",
              }}
            >
              <Icon name={m.icon} size={19} />
            </Link>
          );
        })}
        <div style={{ flex: 1 }} />
        <span style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="help" size={19} /></span>
        <span style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="settings" size={19} /></span>
      </nav>

      {/* ── nav panel ── */}
      <aside
        style={{
          width: 244,
          flexShrink: 0,
          background: "var(--nav)",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          padding: 14,
        }}
      >
        <button style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", width: "100%", textAlign: "left" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "color-mix(in srgb, var(--pink) 60%, transparent)", color: "var(--purple)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>B</span>
          <span style={{ flex: 1, lineHeight: 1.2 }}>
            <span style={{ display: "block", fontWeight: 600, fontSize: 13.5 }}>Bloom &amp; Co</span>
            <span className="muted" style={{ fontSize: 11 }}>United States · Agency</span>
          </span>
          <Icon name="chevron" size={14} className="" />
        </button>

        <div style={{ height: 8 }} />

        {GROUPS.map((g) => {
          const items = MODULES.filter((m) => m.group === g);
          if (!items.length) return null;
          return (
            <div key={g} style={{ marginBottom: 4 }}>
              <div className="eyebrow" style={{ fontSize: 10, padding: "12px 8px 4px" }}>{g}</div>
              {items.map((m) => {
                const on = active?.href === m.href;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 8px",
                      borderRadius: 8,
                      background: on ? "var(--surface)" : "transparent",
                      border: on ? "1px solid var(--line)" : "1px solid transparent",
                      color: on ? "var(--ink)" : "var(--soft)",
                      fontWeight: on ? 600 : 500,
                      fontSize: 13.5,
                    }}
                  >
                    <span style={{ width: 3, height: 14, borderRadius: 2, background: on ? "var(--purple)" : "transparent" }} />
                    {m.name}
                  </Link>
                );
              })}
            </div>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)" }}>
          <span style={{ width: 30, height: 30, borderRadius: 999, background: "var(--purple)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 11 }}>ZD</span>
          <span style={{ flex: 1, lineHeight: 1.2 }}>
            <span style={{ display: "block", fontWeight: 600, fontSize: 13 }}>Zeynep Diril</span>
            <span className="mono muted" style={{ fontSize: 11 }}>148 credits</span>
          </span>
          <Icon name="chevron" size={14} className="" />
        </div>
      </aside>

      {/* ── main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 60, flexShrink: 0, borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <span className="muted">SEO Studio</span>
            <span className="muted">›</span>
            <strong style={{ fontWeight: 600 }}>{active?.name ?? "App"}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="chip mono" style={{ fontSize: 12 }}>148 credits</span>
            <span className="muted" style={{ fontSize: 13 }}>5 articles left</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </main>
    </div>
  );
}
