export const siteConfig = {
  name: "Hey Genyl",
  title: "Freelance SEO Specialist & WordPress SEO Expert | Hey Genyl",
  description:
    "Freelance SEO specialist, local SEO, and WordPress SEO expert helping local businesses rank higher, drive more traffic, and attract qualified leads. Let's talk.",
  url: "https://heygenyl.com",
  email: "hi@heygenyl.com",
  location: "Philippines",
};

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
  navLabel?: string;
  shortTitle: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  chips: string[];
  heroAccentLead?: string;
  deliverables: Array<{ title: string; copy: string; image?: string }>;
  idealFor: string[];
  outcomes: string[];
  process: Array<{ title: string; copy: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export const servicePages: ServicePage[] = [
  {
    slug: "seo",
    navLabel: "SEO",
    shortTitle: "SEO specialist",
    title: "Freelance SEO Specialist for Hire",
    heroAccentLead: "Freelance SEO",
    metaTitle: "Freelance SEO Specialist for Hire | Hey Genyl",
    metaDescription:
      "Need a freelance SEO specialist who can audit, prioritize, and help ship search improvements across content, technical fixes, and website structure?",
    summary:
      "Hire a freelance SEO specialist who works like part of your team, not a faceless agency. I audit your site, prioritize the fixes that actually move rankings, and ship the technical, on-page, and content work that turns search traffic into qualified leads and booked calls — then report on the numbers that affect revenue, not vanity metrics. You deal with one accountable person from strategy through to implementation, so nothing gets lost between departments.",
    chips: ["Audit-first approach", "On-page & technical SEO", "Reporting tied to leads"],
    deliverables: [
      {
        title: "SEO audit & opportunity map",
        copy:
          "A full audit of your rankings, content, and technical health, paired with a prioritized map of the highest-impact moves to make first — so you know exactly where the next win is and why it matters.",
      },
      {
        title: "Keyword & search-intent strategy",
        copy:
          "Keyword clusters built around real buyer intent and mapped to the right pages, so your money pages stop competing with each other and start ranking for the terms that actually convert.",
      },
      {
        title: "On-page & content optimization",
        copy:
          "Titles, headings, links, and copy rewritten around search intent and conversion — turning thin, unfocused pages into ones that rank and move visitors toward contacting you.",
      },
      {
        title: "Technical SEO fixes",
        copy:
          "Crawl, indexation, speed, and template issues fixed or handed off as clear developer briefs, so search engines can reach, understand, and reward your most important pages.",
      },
      {
        title: "Internal linking & site structure",
        copy:
          "A cleaner architecture and internal-link plan that points authority at your highest-value pages and guides visitors toward the ones that generate enquiries.",
      },
      {
        title: "Reporting tied to leads, not vanity metrics",
        copy:
          "Plain-English monthly reporting on rankings, qualified traffic, and conversions — the numbers that affect revenue — not a dashboard export you're left to decode.",
      },
    ],
    idealFor: [
      "An existing website that should be generating far more leads than it currently does",
      "A freelance SEO specialist you can hire directly, without agency overhead or account managers",
      "Someone who can both set the strategy and do, or direct, the hands-on work",
      "Search results tied to revenue and qualified enquiries, not vanity traffic",
      "One accountable point of contact for both SEO strategy and execution",
    ],
    outcomes: [
      "Priority service and money pages that rank for the terms buyers actually search",
      "Fewer pages competing with each other and far less wasted crawl budget",
      "A steadier pipeline of qualified organic visitors instead of one-off traffic spikes",
      "A clear reporting story that ties every SEO change back to leads and revenue",
      "One specialist who owns the result instead of passing you between departments",
    ],
    process: [
      {
        title: "Discovery & audit",
        copy:
          "We start with a paid audit. I dig into your rankings, analytics, competitors, and site health to pinpoint what is holding you back and where the fastest qualified-lead gains are hiding.",
      },
      {
        title: "Strategy & roadmap",
        copy:
          "You get a prioritized SEO roadmap — technical, on-page, and content tasks ranked by impact and effort — so every hour of work goes toward the changes most likely to move revenue. Nothing on the list is busywork, and you can see exactly why each task earns its place.",
      },
      {
        title: "Implementation & handoff",
        copy:
          "I ship the work directly or hand your team clear, specific briefs instead of vague audit jargon, so fixes actually get done rather than sitting in a backlog for months.",
      },
      {
        title: "Reporting & iteration",
        copy:
          "Every month I track rankings, traffic quality, and conversions, report in plain English, and adjust the plan based on what the data shows is genuinely working. You always know what was done, what it moved, and what comes next.",
      },
    ],
    faq: [
      {
        question: "How much does it cost to hire a freelance SEO specialist?",
        answer:
          "Pricing is scoped after a short call and a paid audit, so you are never quoting blind. From there, work runs as a one-off project or a monthly retainer, depending on how much hands-on help your site needs. You pay for the SEO work your site actually requires, not an agency retainer you cannot fully use.",
      },
      {
        question: "How soon will I see results from SEO?",
        answer:
          "Technical and on-page fixes can show movement within weeks, but meaningful ranking and lead gains usually take three to six months, depending on your competition and starting point. I focus the early work on the pages closest to converting, so you see qualified results as fast as is realistically possible.",
      },
      {
        question: "Am I locked into a long contract?",
        answer:
          "No. Engagements stay flexible — project-based or month to month — so you continue because the work is paying off, not because a contract is keeping you there.",
      },
      {
        question: "Who actually does the work, you or a team?",
        answer:
          "Me. You work directly with the specialist doing your SEO. When something needs a developer or designer, I write the exact briefs and coordinate the handoff so nothing is lost in translation.",
      },
      {
        question: "Why hire a freelance SEO specialist instead of an agency?",
        answer:
          "You get senior, hands-on attention without paying for account managers, sales teams, and overhead. Communication is direct, decisions happen faster, and more of your budget goes into actual SEO work instead of agency margin. Because I am the one doing the work, you always know exactly who is accountable for your results.",
      },
      {
        question: "Do you work with WordPress and other platforms?",
        answer:
          "Yes. WordPress is a core strength, from template and plugin fixes to speed and schema, and I also work across most common CMS and custom builds. If your site runs on WordPress, strategy and implementation can happen in one place instead of being split across two vendors.",
      },
      {
        question: "What does a typical engagement include?",
        answer:
          "A prioritized audit, a clear roadmap, hands-on on-page and technical work or developer-ready briefs, and monthly reporting tied to leads and revenue. The exact mix is scoped to your site, your goals, and your team's capacity, so you are never paying for work that does not apply to you.",
      },
      {
        question: "Do you offer one-off SEO audits, or only ongoing work?",
        answer:
          "Both. Some clients start with a standalone audit and roadmap they implement themselves, while others keep me on monthly to do the work and report on results. You can start small with an audit and scale up only once the engagement is clearly paying off.",
      },
      {
        question: "What kind of businesses do you work with?",
        answer:
          "Mostly service businesses, local brands, and lead-generation sites that need qualified enquiries rather than raw traffic. If your site already has some history and you want it to generate more of the right leads, it is usually a strong fit — and I will tell you honestly if it is not.",
      },
    ],
  },
  {
    slug: "seo/local-seo",
    navLabel: "Local SEO",
    shortTitle: "Maps & GBP Specialist",
    title: "Maps & GBP Specialist",
    metaTitle: "Maps & GBP Specialist | Hey Genyl",
    metaDescription:
      "Maps and GBP specialist support for service-area businesses that need stronger map visibility, cleaner service pages, and more qualified local leads.",
    summary:
      "Stronger map visibility and sharper service-area pages for local businesses — Google Business Profile alignment, better-targeted location pages, and a clearer path from nearby searches to calls and form fills.",
    chips: ["GBP support", "Service areas", "Local landing pages"],
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
    slug: "seo/technical-seo",
    navLabel: "Technical SEO",
    shortTitle: "Technical SEO specialist",
    title: "Technical SEO Specialist",
    metaTitle: "Technical SEO Specialist | Hey Genyl",
    metaDescription:
      "Technical SEO support for crawl issues, indexation problems, site migrations, Core Web Vitals concerns, and template-level fixes.",
    summary:
      "Fix the issues hiding beneath your rankings — crawl errors, indexation problems, messy templates, and risky migrations — with focused technical SEO that gives your content a clean foundation to perform.",
    chips: ["Crawl health", "Indexation", "Template QA"],
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
      "An SEO audit built for decisions, not screenshots: a prioritized action plan that tells you exactly what to fix, publish, or consolidate next — and why each move matters for your traffic and leads.",
    chips: ["Prioritized audit", "Opportunity sizing", "Action plan"],
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
    slug: "web-design/wordpress-web-design",
    navLabel: "WordPress Web Design",
    shortTitle: "WordPress website designer",
    title: "WordPress Website Designer",
    metaTitle: "WordPress Website Designer | Hey Genyl",
    metaDescription:
      "WordPress website design for search-first service sites that need sharper messaging, better structure, and performance-aware layouts.",
    summary:
      "WordPress design for service businesses that need more than a fresh look — search-first structure, conversion-aware layouts, and a redesign plan that protects the search equity you already have.",
    chips: ["Search-first UX", "Service pages", "Conversion layout"],
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
    slug: "seo/wordpress-seo",
    navLabel: "WordPress SEO",
    shortTitle: "WordPress SEO expert",
    title: "WordPress SEO Expert",
    metaTitle: "WordPress SEO Expert | Hey Genyl",
    metaDescription:
      "WordPress SEO expert support for search-focused service websites, technical fixes, template cleanup, and conversion-aware page implementation.",
    summary:
      "One person to connect SEO strategy with real WordPress implementation — template fixes, search-ready landing pages, and a steadier publishing workflow that lifts rankings, UX, and lead generation together.",
    chips: ["WordPress SEO", "Template implementation", "Page builds"],
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
  {
    slug: "web-design",
    navLabel: "Web Design",
    shortTitle: "Web design",
    title: "Web Design for Service Businesses",
    heroAccentLead: "Web Design",
    metaTitle: "Web Design for Service Businesses | Hey Genyl",
    metaDescription:
      "Search-first web design for service businesses — conversion-focused layouts, clean site structure, and builds that protect and grow your organic visibility.",
    summary:
      "Web design built to rank and convert, not just look good. I plan pages around search intent and buyer decisions, structure content so it is easy to scan and act on, and keep the build technically clean so design choices support your SEO instead of undermining it — with redirect and content mapping baked in whenever we touch an existing site.",
    chips: ["Search-first UX", "Conversion layouts", "SEO-safe builds"],
    deliverables: [
      {
        title: "Message-first page structure",
        copy:
          "Every page is planned around the intent, proof, and next action a visitor needs, so layout decisions support the search and conversion goal instead of fighting it.",
      },
      {
        title: "Conversion-aware layouts",
        copy:
          "Clear hierarchy, obvious calls to action, visible internal links, and scannable sections that move visitors toward contacting you.",
      },
      {
        title: "SEO-safe build & handoff",
        copy:
          "Clean templates, sensible URL structure, and redirect plus content mapping whenever we rework an existing site, so you keep the search equity you already have.",
      },
      {
        title: "Performance-minded delivery",
        copy:
          "Lightweight, fast-loading pages with the technical fundamentals in place, because speed and stability are part of both UX and rankings.",
      },
    ],
    idealFor: [
      "Service businesses whose current site looks dated or converts poorly",
      "Owners planning a redesign who cannot afford to lose existing rankings",
      "Projects that need design and SEO thinking handled by one person",
    ],
    outcomes: [
      "A modern site built around how your buyers actually search and decide",
      "Stronger continuity between design decisions and search performance",
      "A cleaner base for publishing, internal linking, and future content work",
    ],
    process: processSteps,
    faq: [
      {
        question: "Can you redesign my site without hurting my rankings?",
        answer:
          "Yes. Redirect mapping, content preservation, metadata checks, and technical QA are part of the process, so the new design launches without throwing away the search equity you already have.",
      },
      {
        question: "Do you build on WordPress or another platform?",
        answer:
          "WordPress is the usual home for these builds, and there is a dedicated WordPress web design service for that. If a different platform fits your goals better, we can talk it through before committing.",
      },
    ],
  },
];

export const activeServiceOrder = [
  "seo",
  "seo/local-seo",
  "seo/technical-seo",
  "seo/wordpress-seo",
  "web-design",
  "web-design/wordpress-web-design",
] as const;

export const activeServiceSlugSet = new Set<string>(activeServiceOrder);

export const activeServicePages = activeServiceOrder.map((slug) => {
  const service = servicePages.find((item) => item.slug === slug);
  if (!service) {
    throw new Error(`Unknown active service slug: ${slug}`);
  }
  return service;
});

// Category hubs only (slugs without a nested segment): SEO, Web Design.
export const topLevelServicePages = activeServicePages.filter(
  (service) => !service.slug.includes("/"),
);

// Direct child services of a hub, e.g. getChildServices("seo") -> local/technical/wordpress SEO.
export const getChildServices = (parentSlug: string) =>
  activeServicePages.filter((service) => {
    if (!service.slug.startsWith(`${parentSlug}/`)) return false;
    return !service.slug.slice(parentSlug.length + 1).includes("/");
  });

export type CaseStudyPage = {
  slug: string;
  shortTitle: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
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
    slug: "desert-it-solutions-msp",
    shortTitle: "Desert IT Solutions MSP",
    title: "Desert IT Solutions MSP Case Study",
    metaTitle: "Desert IT Solutions MSP Case Study | Hey Genyl",
    metaDescription:
      "Desert I.T. Solutions MSP case study covering SEO positioning, service-page structure, and lead-quality improvements for a Las Vegas managed IT provider.",
    summary:
      "Desert I.T. Solutions is a Las Vegas-based managed IT company that helps businesses stay ahead of IT issues through proactive system monitoring, vulnerability management, and ongoing technical support. Their managed services model keeps client environments secure, stable, and ready to scale.",
    chips: ["B2B services", "Managed IT", "SEO strategy"],
    snapshot: [
      { label: "Primary focus", value: "Managed IT intent mapping" },
      { label: "Main fix", value: "Service-page architecture" },
      { label: "Best proof", value: "Qualified consultation leads" },
      { label: "Support page", value: "SEO specialist" },
    ],
    challengeTitle: "The offer was strong, but the search positioning was too broad.",
    challenge: [
      "Core managed IT services and support content overlapped on the same page targets",
      "High-value differentiators were buried too low in the content hierarchy",
      "Pages captured visibility but did not clearly pre-qualify the right-fit buyer",
    ],
    strategyTitle: "Reframe pages around intent, trust, and commercial clarity.",
    strategy: [
      "Split managed services, cybersecurity, and support offerings into clearer page clusters",
      "Move proof, process clarity, and CTA messaging higher on key landing pages",
      "Tighten internal linking across service, industry, and conversion pages",
    ],
    proofPoints: [
      {
        title: "Lead quality improvement",
        copy:
          "After the restructuring, more inquiries matched ideal managed-service profiles instead of generic support requests.",
      },
      {
        title: "Service visibility gains",
        copy:
          "Priority service pages improved alignment for commercial managed IT and cybersecurity terms.",
      },
      {
        title: "Stronger conversion path",
        copy:
          "Navigation and internal-link flows reduced friction between first click and consultation intent.",
      },
    ],
    serviceHref: "/services/seo/",
  },
  {
    slug: "the-works-auto-center-car-detailing",
    shortTitle: "Car Detailing",
    title: "The Works Auto Center Case Study",
    metaTitle: "The Works Auto Center Case Study | Hey Genyl",
    metaDescription:
      "Starter auto detailing SEO case study structure focused on service intent, packages, local visibility, and stronger conversion paths.",
    summary:
      "The Works Auto Center is a veteran-owned auto detailing and body shop in Albany, NY, offering everything from paint protection film and ceramic coatings to full body repair and insurance-approved bodywork.",
    chips: ["Local service brand", "Package positioning", "Lead-gen UX"],
    snapshot: [
      { label: "Primary focus", value: "Package clarity" },
      { label: "Main fix", value: "Offer-to-page alignment" },
      { label: "Best proof", value: "Booking intent" },
      { label: "Support page", value: "WordPress SEO expert" },
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
    serviceHref: "/services/seo/wordpress-seo/",
  },
  {
    slug: "everything-probate-legal-firm",
    shortTitle: "Legal Firm",
    title: "Everything Probate Case Study",
    metaTitle: "Everything Probate Case Study | Hey Genyl",
    metaDescription:
      "Starter law firm SEO case study structure for practice-area pages, authority signals, and local + service intent separation.",
    summary:
      "Everything Probate needed its practice-area pages to map cleanly to client intent — separating probate and estate services, reinforcing authority signals, and turning broad legal queries into better-qualified consultations.",
    chips: ["Legal SEO", "Practice-area pages", "Authority signals"],
    snapshot: [
      { label: "Primary focus", value: "Practice intent" },
      { label: "Main fix", value: "Authority placement" },
      { label: "Best proof", value: "Consultation quality" },
      { label: "Support page", value: "Freelance SEO specialist" },
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
    serviceHref: "/services/seo/",
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
