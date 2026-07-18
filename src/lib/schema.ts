export type SchemaOutline = {
  title: string;
  mainEntity: string;
  relatedEntities: string[];
  userIntent: string;
  faq: { q: string; a: string }[];
  eeatSignals?: { expertise?: string };
};

// Build copy-ready JSON-LD entity schema: an Article that declares its main entity (about) and
// related entities (mentions), an author Person (E-E-A-T), plus a FAQPage.
export function buildSchema(o: SchemaOutline): string {
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
