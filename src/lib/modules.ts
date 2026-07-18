export type ModuleStatus = "live" | "soon";

export type AppModule = {
  name: string;
  short: string;
  href: string;
  blurb: string;
  status: ModuleStatus;
  group: "Site Health" | "Research" | "Content" | "Intelligence";
  icon: IconKey;
};

export type IconKey =
  | "shield"
  | "search"
  | "layers"
  | "send"
  | "pen"
  | "calendar"
  | "chart"
  | "code";

export const MODULES: AppModule[] = [
  {
    name: "Site & Technical Audit",
    short: "Audit",
    href: "/audit",
    blurb: "Paste a URL, get a scored SEO / GEO / AEO report with a prioritized fix list.",
    status: "live",
    group: "Site Health",
    icon: "shield",
  },
  {
    name: "Keyword / Query Research",
    short: "Query",
    href: "/research",
    blurb: "A seed keyword becomes the full query universe — the real queries and intents behind the topic.",
    status: "live",
    group: "Research",
    icon: "search",
  },
  {
    name: "Topical Authority",
    short: "Authority",
    href: "/authority",
    blurb: "Pillar → cluster → support map so you own the whole topic, not one page.",
    status: "live",
    group: "Research",
    icon: "layers",
  },
  {
    name: "Content Writing",
    short: "Write",
    href: "/write",
    blurb: "Query → outline → GEO-tuned draft with FAQ schema and a live optimization score.",
    status: "live",
    group: "Content",
    icon: "pen",
  },
  {
    name: "Entity Schema",
    short: "Schema",
    href: "/schema",
    blurb: "Copy-ready JSON-LD — declare your main entity, related entities, author and FAQ for Google & AI.",
    status: "live",
    group: "Content",
    icon: "code",
  },
  {
    name: "Opportunity Report",
    short: "Report",
    href: "/reports",
    blurb: "A SERP content report for any query — competitor gaps, EEAT & AI-search opportunities to capture.",
    status: "live",
    group: "Intelligence",
    icon: "chart",
  },
];
