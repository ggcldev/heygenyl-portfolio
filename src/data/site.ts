export const siteConfig = {
  name: "Hey Genyl",
  title: "Freelance SEO Specialist and WordPress Designer/Developer",
  description:
    "SEO specialist and WordPress designer/developer building lean, search-first websites for local service brands and B2B teams.",
  url: "https://heygenyl.com",
  email: "hello@heygenyl.com",
  location: "Bacolod City, Philippines",
};

export const homeStats = [
  { label: "Positioning", value: "Freelance SEO specialist" },
  { label: "Hosting fit", value: "Shared-hosting friendly" },
  { label: "Content engine", value: "Blog + case studies + tools" },
  { label: "Build style", value: "Static Astro with fast delivery" },
];

export const processSteps = [
  {
    title: "Audit what already exists",
    copy:
      "Look at crawl health, page intent, internal links, templates, and the content gaps that are slowing results.",
  },
  {
    title: "Prioritize what should ship first",
    copy:
      "Turn raw findings into a roadmap you can execute without guessing which issue matters next.",
  },
  {
    title: "Publish cleaner pages faster",
    copy:
      "Move from recommendations into implementation briefs, updated templates, and conversion-aware content structure.",
  },
];

export type ServicePage = {
  slug: string;
  shortTitle: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  chips: string[];
  note: string;
  deliverables: Array<{ title: string; copy: string }>;
  idealFor: string[];
  outcomes: string[];
  process: Array<{ title: string; copy: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export const servicePages: ServicePage[] = [
  {
    slug: "seo-specialist",
    shortTitle: "SEO specialist",
    title: "Freelance SEO Specialist for Hire",
    metaTitle: "Freelance SEO Specialist for Hire | Hey Genyl",
    metaDescription:
      "Need a freelance SEO specialist who can audit, prioritize, and help ship search improvements across content, technical fixes, and website structure?",
    summary:
      "This page is your core service offer: broad enough to rank for the head term, specific enough to tell clients exactly how you work.",
    chips: ["Search strategy", "Content architecture", "Technical triage"],
    note:
      "Use this as the parent service page that funnels internal links to more specific offers like local SEO, audits, and technical SEO.",
    deliverables: [
      {
        title: "Opportunity mapping",
        copy:
          "Keyword clusters, page intent mapping, and a clearer picture of which pages should drive leads versus educate traffic.",
      },
      {
        title: "Implementation roadmap",
        copy:
          "A prioritized SEO plan with technical, on-page, and content tasks grouped by urgency and business value.",
      },
      {
        title: "Cross-team translation",
        copy:
          "Briefs that make sense to designers, developers, and writers instead of generic audit language that stalls delivery.",
      },
    ],
    idealFor: [
      "Businesses with an existing site that needs clearer SEO ownership",
      "Teams that want freelance support without hiring a full in-house department",
      "Lead-generation sites where traffic quality matters more than vanity metrics",
    ],
    outcomes: [
      "Cleaner priority pages for service and category keywords",
      "Less crawl waste and fewer pages competing with each other",
      "A portfolio-ready reporting narrative tied to business intent",
    ],
    process: processSteps,
    faq: [
      {
        question: "Do you only work on technical SEO?",
        answer:
          "No. The point of this offer is range: technical fixes, content direction, internal links, local visibility, and page-level recommendations all sit under the same strategy umbrella.",
      },
      {
        question: "Who implements the changes?",
        answer:
          "That depends on the project. I can hand off clear implementation notes to your team, collaborate inside your workflow, or pair SEO work with WordPress updates directly.",
      },
    ],
  },
  {
    slug: "local-seo",
    shortTitle: "Local SEO consultant",
    title: "Local SEO Consultant",
    metaTitle: "Local SEO Consultant | Hey Genyl",
    metaDescription:
      "Local SEO consulting for service-area businesses that need stronger map visibility, better service pages, and more qualified local leads.",
    summary:
      "A local SEO page should speak directly to service businesses that need cleaner service-area targeting, GBP support, and pages that convert local intent.",
    chips: ["GBP support", "Service areas", "Local landing pages"],
    note:
      "Use this page to connect your local SEO offer with niche case studies such as plumbing, detailing, gutters, and law.",
    deliverables: [
      {
        title: "Service-area architecture",
        copy:
          "Location and service page structure designed to reduce overlap while expanding search coverage by area and intent.",
      },
      {
        title: "GBP alignment",
        copy:
          "On-site copy, category targeting, and conversion elements that reinforce what your Google Business Profile promises.",
      },
      {
        title: "Lead capture tuning",
        copy:
          "Page sections, internal links, and contact prompts adjusted for the way local visitors actually browse and act.",
      },
    ],
    idealFor: [
      "Multi-city service businesses with overlapping pages",
      "Local brands trying to separate map visibility from site performance",
      "Businesses that need a cleaner service-area content strategy",
    ],
    outcomes: [
      "Better page targeting by city and service intent",
      "Stronger internal links between GBP, homepage, and service pages",
      "A clearer path from discovery to form fills and calls",
    ],
    process: processSteps,
    faq: [
      {
        question: "Is this only for brick-and-mortar businesses?",
        answer:
          "No. Service-area businesses often benefit the most because their pages need careful geographic targeting without creating thin or duplicated content.",
      },
      {
        question: "Can local SEO be done without a full redesign?",
        answer:
          "Yes. In many cases the first gains come from clarifying the page architecture, tightening copy, and fixing weak internal links before any redesign work starts.",
      },
    ],
  },
  {
    slug: "technical-seo",
    shortTitle: "Technical SEO specialist",
    title: "Technical SEO Specialist",
    metaTitle: "Technical SEO Specialist | Hey Genyl",
    metaDescription:
      "Technical SEO support for crawl issues, indexation problems, site migrations, Core Web Vitals concerns, and template-level fixes.",
    summary:
      "This is the service page for the work hidden beneath rankings: crawl paths, canonical signals, rendering issues, internal architecture, and template QA.",
    chips: ["Crawl health", "Indexation", "Template QA"],
    note:
      "Keep this page implementation-focused. Clients hiring technical SEO want clarity on risk, sequencing, and what actually gets fixed.",
    deliverables: [
      {
        title: "Technical issue triage",
        copy:
          "A focused list of technical blockers ranked by how much they affect crawling, indexing, and conversion-critical pages.",
      },
      {
        title: "Template-level recommendations",
        copy:
          "Fixes for canonicals, structured data placement, pagination, heading hierarchy, metadata logic, and duplicate templates.",
      },
      {
        title: "Launch and migration checks",
        copy:
          "Pre- and post-launch QA for redesigned sites, CMS changes, URL shifts, and content rollouts that could damage visibility.",
      },
    ],
    idealFor: [
      "Sites with indexing inconsistencies or bloated URL patterns",
      "WordPress builds that changed structure without an SEO handoff",
      "Service sites dealing with thin pages, canonicals, or redirect debt",
    ],
    outcomes: [
      "Stronger crawl paths and fewer technical surprises during launches",
      "Better alignment between templates and search intent",
      "A cleaner base for content and internal linking work",
    ],
    process: processSteps,
    faq: [
      {
        question: "Do I need a full audit first?",
        answer:
          "Not always. Some projects only need targeted technical review around a migration, redesign, or a handful of recurring issues.",
      },
      {
        question: "Will this improve rankings on its own?",
        answer:
          "Technical SEO creates the conditions for pages to perform properly. Rankings improve fastest when technical fixes are paired with stronger page intent and content coverage.",
      },
    ],
  },
  {
    slug: "seo-audits",
    shortTitle: "SEO audit service",
    title: "SEO Audit Service",
    metaTitle: "SEO Audit Service | Hey Genyl",
    metaDescription:
      "SEO audit service for service businesses and B2B sites that need a prioritized action plan instead of a generic checklist export.",
    summary:
      "This page should sell the value of a sharper audit: not more screenshots, but clearer decisions about what to fix, publish, or consolidate next.",
    chips: ["Prioritized audit", "Opportunity sizing", "Action plan"],
    note:
      "If you use this offer in proposals, keep the audit framed as a decision document, not a giant spreadsheet.",
    deliverables: [
      {
        title: "Executive summary",
        copy:
          "A fast read on what is underperforming, what should be preserved, and where the easiest gains are likely to come from.",
      },
      {
        title: "Priority matrix",
        copy:
          "Findings grouped by impact, urgency, and implementation difficulty so the next sprint is obvious.",
      },
      {
        title: "Roadmap-ready recommendations",
        copy:
          "Practical notes your team can actually action across templates, content, redirects, internal links, or CMS settings.",
      },
    ],
    idealFor: [
      "Teams that know something is wrong but need a cleaner diagnosis",
      "Websites preparing for a redesign, migration, or new content push",
      "Clients who want a one-time engagement before a retainer",
    ],
    outcomes: [
      "Fewer low-priority distractions after the audit lands",
      "A roadmap that can feed directly into sprints or retainer work",
      "Stronger client confidence because the recommendations feel specific",
    ],
    process: processSteps,
    faq: [
      {
        question: "What makes your audit different from automated tools?",
        answer:
          "Tools surface patterns. The value is in the prioritization, the interpretation, and the implementation logic around those patterns.",
      },
      {
        question: "Can an audit include local SEO or WordPress-specific issues?",
        answer:
          "Yes. The audit can focus on the parts of the site and the platform constraints that matter most to the engagement.",
      },
    ],
  },
  {
    slug: "wordpress-design",
    shortTitle: "WordPress website designer",
    title: "WordPress Website Designer",
    metaTitle: "WordPress Website Designer | Hey Genyl",
    metaDescription:
      "WordPress website design for search-first service sites that need sharper messaging, better structure, and performance-aware layouts.",
    summary:
      "Use this page for clients who need a WordPress designer that understands search intent, information architecture, and lead generation instead of design alone.",
    chips: ["Search-first UX", "Service pages", "Conversion layout"],
    note:
      "This page is strongest when it positions design as a business system, not just a visual refresh.",
    deliverables: [
      {
        title: "Message-first wireframes",
        copy:
          "Page sections built around the intent, proof, and action points that should guide a visitor through the page.",
      },
      {
        title: "Conversion-aware layouts",
        copy:
          "Service and homepage designs with better hierarchy, CTA placement, internal-link visibility, and content scannability.",
      },
      {
        title: "SEO-safe redesign planning",
        copy:
          "A clearer handoff between old URLs, new templates, redirect mapping, and on-page changes before a redesign goes live.",
      },
    ],
    idealFor: [
      "WordPress sites that look fine but underperform as lead-generation assets",
      "Businesses planning a redesign without losing existing search equity",
      "Projects that need both UX cleanup and SEO thinking in the same room",
    ],
    outcomes: [
      "More intentional layouts for services, trust, and conversion",
      "Better continuity between design decisions and search goals",
      "A website that looks modern without weakening SEO fundamentals",
    ],
    process: processSteps,
    faq: [
      {
        question: "Do you work from an existing theme or from scratch?",
        answer:
          "Both are possible. The important part is that the page structure, hierarchy, and publishing workflow support the SEO goals from the start.",
      },
      {
        question: "Can you redesign a WordPress site without tanking rankings?",
        answer:
          "Yes, if the redesign includes redirect planning, content mapping, metadata checks, and technical QA before launch.",
      },
    ],
  },
  {
    slug: "wordpress-development",
    shortTitle: "WordPress developer for hire",
    title: "WordPress Developer for Hire",
    metaTitle: "WordPress Developer for Hire | Hey Genyl",
    metaDescription:
      "WordPress development for SEO-focused service websites, landing pages, template cleanup, and implementation support.",
    summary:
      "This page bridges implementation. It is for clients who need the SEO plan translated into actual page builds, template edits, and site updates inside WordPress.",
    chips: ["Template implementation", "Theme cleanup", "Page builds"],
    note:
      "This service works well as the implementation layer beneath your audit, redesign, or content strategy pages.",
    deliverables: [
      {
        title: "Template adjustments",
        copy:
          "Changes to page templates, heading structures, archive behavior, internal-link modules, metadata logic, and schema placement.",
      },
      {
        title: "Landing page builds",
        copy:
          "SEO-aware service pages and conversion-focused layouts built to support ranking intent and lead generation together.",
      },
      {
        title: "Publishing support",
        copy:
          "A steadier workflow for updating blogs, case studies, redirects, reusable blocks, and supporting assets without breaking the site.",
      },
    ],
    idealFor: [
      "WordPress sites where the SEO roadmap exists but nobody is implementing it",
      "Design projects that need technical follow-through",
      "Service businesses that want one person to connect strategy and deployment",
    ],
    outcomes: [
      "Faster turnaround on SEO-backed page updates",
      "Less friction between recommendations and actual deployment",
      "A stronger platform for publishing weekly content and case studies",
    ],
    process: processSteps,
    faq: [
      {
        question: "Are you only a developer or do you also handle SEO direction?",
        answer:
          "The value here is overlap. You do not need to explain the SEO goal to one person and the WordPress implementation to another.",
      },
      {
        question: "Can this include blog and case-study templates?",
        answer:
          "Yes. Blog, resource, and case-study templates are usually where design consistency and SEO structure need the most cleanup.",
      },
    ],
  },
];

export type CaseStudyPage = {
  slug: string;
  shortTitle: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  note: string;
  chips: string[];
  snapshot: Array<{ label: string; value: string }>;
  challengeTitle: string;
  challenge: string[];
  strategyTitle: string;
  strategy: string[];
  proofPoints: Array<{ title: string; copy: string }>;
  serviceHref: string;
};

export const caseStudies: CaseStudyPage[] = [
  {
    slug: "gutter-company-seo",
    shortTitle: "Gutter company SEO",
    title: "Gutter Company SEO Case Study",
    metaTitle: "Gutter Company SEO Case Study | Hey Genyl",
    metaDescription:
      "Starter gutter company SEO case study structure for service pages, location targeting, and lead-focused content improvements.",
    summary:
      "A home-service case study format built for service-area intent, city-specific demand, and high-friction local conversion journeys.",
    note:
      "Swap in the client name, before-and-after screenshots, and actual lead metrics before publishing this page live.",
    chips: ["Home services", "Local SEO", "Service-area pages"],
    snapshot: [
      { label: "Primary focus", value: "Service + city intent" },
      { label: "Main fix", value: "Cleaner page overlap" },
      { label: "Best proof", value: "Calls and form quality" },
      { label: "Support page", value: "Local SEO consultant" },
    ],
    challengeTitle: "The site looked broad, but the search intent was hyper-local.",
    challenge: [
      "Multiple gutter services were competing for the same city-modified keywords",
      "Trust signals existed, but they were buried below generic copy blocks",
      "Location targeting relied too heavily on shallow content variations",
    ],
    strategyTitle: "Make the offer local, specific, and easier to convert.",
    strategy: [
      "Separate core services from city intent instead of mixing both on every page",
      "Rewrite proof and CTA sections closer to the top of the layout",
      "Strengthen internal links between the homepage, service pages, and local entry points",
    ],
    proofPoints: [
      {
        title: "Organic lead quality",
        copy:
          "Show how quote requests or calls became more aligned with the right service areas after the page architecture was tightened.",
      },
      {
        title: "Service page visibility",
        copy:
          "Highlight movement across the most important service phrases instead of broad ranking screenshots with low business value.",
      },
      {
        title: "Crawl clarity",
        copy:
          "Document how redundant pages were removed or consolidated so search engines had a cleaner understanding of the offer.",
      },
    ],
    serviceHref: "/services/local-seo/",
  },
  {
    slug: "auto-detailing-seo",
    shortTitle: "Auto detailing SEO",
    title: "Auto Detailing SEO Case Study",
    metaTitle: "Auto Detailing SEO Case Study | Hey Genyl",
    metaDescription:
      "Starter auto detailing SEO case study structure focused on service intent, packages, local visibility, and stronger conversion paths.",
    summary:
      "Auto detailing sites usually need tighter package positioning, better service page hierarchy, and stronger proof placement to convert search traffic.",
    note:
      "If this becomes a public case study, add the service package names, city targets, and the exact pages that improved.",
    chips: ["Local service brand", "Package positioning", "Lead-gen UX"],
    snapshot: [
      { label: "Primary focus", value: "Package clarity" },
      { label: "Main fix", value: "Offer-to-page alignment" },
      { label: "Best proof", value: "Booking intent" },
      { label: "Support page", value: "WordPress website designer" },
    ],
    challengeTitle: "The site had demand, but the offer structure made comparison harder than it should be.",
    challenge: [
      "Package and service names were inconsistent across pages",
      "High-intent visitors landed on pages that buried the service details",
      "Important trust elements and visual proof lacked a clear hierarchy",
    ],
    strategyTitle: "Clarify the offer before trying to scale content.",
    strategy: [
      "Group services into clearer intent buckets with stronger on-page scannability",
      "Move pricing cues, proof, and FAQs closer to action points",
      "Connect location modifiers to the right package pages instead of the entire site",
    ],
    proofPoints: [
      {
        title: "Booking readiness",
        copy:
          "Show whether more visitors reached contact or booking actions after the page structure was simplified.",
      },
      {
        title: "Keyword-to-page match",
        copy:
          "Point out the service phrases that finally had dedicated landing pages instead of one broad catch-all page.",
      },
      {
        title: "On-page engagement",
        copy:
          "Use scroll depth, clicks, or inquiry quality if you track them. Those metrics fit this niche better than impressions alone.",
      },
    ],
    serviceHref: "/services/wordpress-design/",
  },
  {
    slug: "law-firm-seo",
    shortTitle: "Law firm SEO",
    title: "Law Firm SEO Case Study",
    metaTitle: "Law Firm SEO Case Study | Hey Genyl",
    metaDescription:
      "Starter law firm SEO case study structure for practice-area pages, authority signals, and local + service intent separation.",
    summary:
      "Law firm SEO case studies should foreground trust, specificity, and page intent because the wrong site structure can waste valuable queries fast.",
    note:
      "If you anonymize the client, keep the practice areas and the conversion problem specific. Vague legal SEO case studies are easy to forget.",
    chips: ["Legal SEO", "Practice-area pages", "Authority signals"],
    snapshot: [
      { label: "Primary focus", value: "Practice intent" },
      { label: "Main fix", value: "Authority placement" },
      { label: "Best proof", value: "Consultation quality" },
      { label: "Support page", value: "SEO audit service" },
    ],
    challengeTitle: "The site needed more than rankings. It needed search intent to map cleanly to trust.",
    challenge: [
      "Practice-area pages overlapped and diluted topical signals",
      "Trust elements existed but were not reinforcing the right pages",
      "Local modifiers and practice terms were blended without clear hierarchy",
    ],
    strategyTitle: "Rebuild authority around practice pages instead of the homepage carrying everything.",
    strategy: [
      "Tighten page intent between broad firm pages and specific practice pages",
      "Improve the order of proof, FAQs, and calls to action on high-value pages",
      "Audit internal links so authority flowed toward revenue-driving practice areas",
    ],
    proofPoints: [
      {
        title: "Practice-page performance",
        copy:
          "Track which practice-area pages started attracting better long-tail traffic after the overlap was reduced.",
      },
      {
        title: "Consultation fit",
        copy:
          "If available, note whether inquiry quality improved because visitors were landing on better matched pages.",
      },
      {
        title: "Trust engagement",
        copy:
          "Use supporting behavior such as attorney bio views, FAQ interaction, or form progression if you have it.",
      },
    ],
    serviceHref: "/services/seo-audits/",
  },
  {
    slug: "plumbing-hvac-seo",
    shortTitle: "Plumbing and HVAC SEO",
    title: "Plumbing and HVAC SEO Case Study",
    metaTitle: "Plumbing and HVAC SEO Case Study | Hey Genyl",
    metaDescription:
      "Starter plumbing and HVAC SEO case study structure for multi-service local businesses, emergency pages, and service-area architecture.",
    summary:
      "Plumbing and HVAC sites usually combine multiple urgent services, broad location targeting, and seasonal demand. That makes structure everything.",
    note:
      "This page is strongest when you can show how emergency service intent was separated from broader service pages.",
    chips: ["Emergency intent", "Multi-service local", "Location structure"],
    snapshot: [
      { label: "Primary focus", value: "Emergency + core services" },
      { label: "Main fix", value: "Intent separation" },
      { label: "Best proof", value: "Call-driven pages" },
      { label: "Support page", value: "Technical SEO specialist" },
    ],
    challengeTitle: "Too many services were sharing page space, and urgent intent was getting diluted.",
    challenge: [
      "Emergency pages, city pages, and general services were competing against each other",
      "Template repetition made pages harder to differentiate",
      "Internal links did not reflect the urgency or value of certain service paths",
    ],
    strategyTitle: "Separate urgency, service depth, and geography cleanly.",
    strategy: [
      "Clarify which pages should capture emergency intent versus research intent",
      "Reduce template duplication and strengthen service-level differentiation",
      "Direct internal authority toward pages that handle the most urgent or profitable traffic",
    ],
    proofPoints: [
      {
        title: "Call-path visibility",
        copy:
          "Document whether phone-focused pages became easier to find and better aligned with urgent queries.",
      },
      {
        title: "Template cleanup",
        copy:
          "Show how duplicate headings, metadata logic, or repeated sections were improved across service templates.",
      },
      {
        title: "Service-page focus",
        copy:
          "Include the pages that stopped cannibalizing each other after the architecture was reworked.",
      },
    ],
    serviceHref: "/services/technical-seo/",
  },
  {
    slug: "b2b-enterprise-seo",
    shortTitle: "B2B enterprise SEO",
    title: "B2B Enterprise SEO Case Study",
    metaTitle: "B2B Enterprise SEO Case Study | Hey Genyl",
    metaDescription:
      "Starter B2B enterprise SEO case study structure for technical audits, content ecosystems, stakeholder handoffs, and complex website governance.",
    summary:
      "Use this page for enterprise or industrial work where the value comes from better governance, technical clarity, and page architecture that supports long sales cycles.",
    note:
      "This page is a strong place to reference energy, industrial, or manufacturing experience once you are ready to publish the exact account names.",
    chips: ["B2B SEO", "Enterprise workflows", "Technical governance"],
    snapshot: [
      { label: "Primary focus", value: "Complex site governance" },
      { label: "Main fix", value: "Cross-team clarity" },
      { label: "Best proof", value: "Roadmap adoption" },
      { label: "Support page", value: "Freelance SEO specialist" },
    ],
    challengeTitle: "The issue was not only traffic. It was coordination across large sites and long review cycles.",
    challenge: [
      "Multiple stakeholders influenced templates, publishing, and technical changes",
      "Important content opportunities were slowed by unclear ownership",
      "Technical findings had to translate into realistic implementation workstreams",
    ],
    strategyTitle: "Turn SEO from a report into a system the team can use.",
    strategy: [
      "Organize the roadmap by implementation owner instead of issue type alone",
      "Connect technical fixes to content opportunities and page priorities",
      "Build documentation that developers, writers, and managers could act on without re-translation",
    ],
    proofPoints: [
      {
        title: "Implementation adoption",
        copy:
          "Show how recommendations moved into sprint planning, content production, or template updates across teams.",
      },
      {
        title: "Technical focus",
        copy:
          "Use examples of crawl, indexation, or template logic improvements that made enterprise pages easier to scale.",
      },
      {
        title: "Commercial relevance",
        copy:
          "Tie the work back to visibility around core solution pages, not just informational traffic.",
      },
    ],
    serviceHref: "/services/seo-specialist/",
  },
];

export type ToolPage = {
  slug: string;
  shortTitle: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  chips: string[];
  note: string;
};

export const toolPages: ToolPage[] = [
  {
    slug: "schema-generator",
    shortTitle: "Schema generator",
    title: "Free Schema Markup Generator",
    metaTitle: "Free Schema Markup Generator | Hey Genyl",
    metaDescription:
      "Client-side schema markup generator for ProfessionalService, LocalBusiness, FAQ, and Article JSON-LD snippets.",
    summary:
      "A browser-based SEO tool that lets visitors build clean JSON-LD snippets without installing anything or sending data to a server.",
    chips: ["Client-side tool", "JSON-LD output", "Copy-ready markup"],
    note:
      "This is the kind of lightweight utility that works perfectly on Hostinger shared hosting because all processing happens in the browser.",
  },
  {
    slug: "meta-tag-analyzer",
    shortTitle: "Meta tag analyzer",
    title: "Meta Tag Analyzer",
    metaTitle: "Meta Tag Analyzer | Hey Genyl",
    metaDescription:
      "Paste a head snippet or HTML document and review title, description, canonical, robots, Open Graph, and Twitter tag coverage.",
    summary:
      "A practical browser-based analyzer for pasted HTML. Useful for quick QA during audits, migrations, or page launches.",
    chips: ["Pasted HTML review", "Length checks", "SEO QA"],
    note:
      "This tool is intentionally input-based so it works on static hosting without cross-origin fetch limitations.",
  },
  {
    slug: "404-checker",
    shortTitle: "404 checker",
    title: "Website 404 Checker",
    metaTitle: "Website 404 Checker | Hey Genyl",
    metaDescription:
      "Starter 404 checker interface for same-origin or CORS-enabled URLs, with a clear upgrade path to a serverless crawler.",
    summary:
      "A starter checker that demonstrates the UX and request flow. Same-origin checks work in the browser; cross-domain crawling needs a serverless backend.",
    chips: ["Browser-based demo", "Same-origin ready", "Serverless upgrade path"],
    note:
      "This page helps you show product thinking now while leaving room for a proper crawler or worker endpoint later.",
  },
];

export const getServiceBySlug = (slug: string) => {
  const service = servicePages.find((item) => item.slug === slug);
  if (!service) {
    throw new Error(`Unknown service slug: ${slug}`);
  }
  return service;
};

export const getCaseStudyBySlug = (slug: string) => {
  const study = caseStudies.find((item) => item.slug === slug);
  if (!study) {
    throw new Error(`Unknown case study slug: ${slug}`);
  }
  return study;
};

export const getToolBySlug = (slug: string) => {
  const tool = toolPages.find((item) => item.slug === slug);
  if (!tool) {
    throw new Error(`Unknown tool slug: ${slug}`);
  }
  return tool;
};
