export type SchemaTemplatePack = {
  id: string;
  title: string;
  filename: string;
  placement: string;
  whyItMatters: string;
  code: string;
};

type SchemaTemplateInput = {
  domain: string;
  companyName: string;
  companyDescription?: string;
};

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function cleanDescription(companyName: string, companyDescription?: string) {
  const fallback = `${companyName} helps buyers understand the company, product, and use cases through direct-answer commercial pages.`;
  const normalized = companyDescription?.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
}

// Adapted from MIT-licensed schema patterns published in zubair-trabzada/geo-seo-claude.
export function buildSchemaTemplates(input: SchemaTemplateInput): SchemaTemplatePack[] {
  const domain = input.domain.replace(/^www\./, "").toLowerCase();
  const origin = `https://${domain}`;
  const companyName = input.companyName;
  const description = cleanDescription(companyName, input.companyDescription);

  return [
    {
      id: "organization",
      title: "Organization schema",
      filename: "organization.json",
      placement: "Add site-wide in the global layout or homepage head.",
      whyItMatters:
        "This gives AI systems a stable entity record for your company, brand name, URL, and identity references.",
      code: json({
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: companyName,
        url: origin,
        description,
        logo: `${origin}/logo.png`,
        sameAs: [
          "https://www.linkedin.com/company/your-company",
          "https://x.com/yourbrand",
        ],
      }),
    },
    {
      id: "website-searchaction",
      title: "WebSite + SearchAction schema",
      filename: "website-searchaction.json",
      placement: "Add in the homepage head if the site has a working search URL.",
      whyItMatters:
        "This helps search and AI systems understand the site as a searchable source instead of a generic marketing shell.",
      code: json({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: companyName,
        url: origin,
        description,
        publisher: {
          "@type": "Organization",
          "@id": `${origin}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${origin}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: "en-US",
      }),
    },
    {
      id: "software-saas",
      title: "SoftwareApplication schema",
      filename: "software-saas.json",
      placement: "Add on the main product or pricing page.",
      whyItMatters:
        "This gives AI systems machine-readable product, category, and commercial context on the page that should win comparison queries.",
      code: json({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: companyName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: origin,
        description,
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: "997",
          availability: "https://schema.org/InStock",
        },
        provider: {
          "@type": "Organization",
          "@id": `${origin}/#organization`,
        },
      }),
    },
    {
      id: "article-author",
      title: "Article + author schema",
      filename: "article-author.json",
      placement: "Add on thought-leadership, comparison, and buyer-guide pages.",
      whyItMatters:
        "This makes authority pages easier for AI systems to cite because the page has a named author, publisher, and publish metadata.",
      code: json({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${companyName} buyer guide title`,
        description: "Replace this with the exact page summary.",
        mainEntityOfPage: `${origin}/resources/your-guide`,
        author: {
          "@type": "Person",
          name: "Founder or subject-matter author",
          jobTitle: "Founder",
        },
        publisher: {
          "@type": "Organization",
          "@id": `${origin}/#organization`,
        },
        datePublished: "2026-01-01",
        dateModified: "2026-01-01",
      }),
    },
  ];
}
