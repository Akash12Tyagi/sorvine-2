/**
 * All copy and links live here so text can be edited in one place.
 * Hero, intent and AI-core copy is word-for-word from the design reference.
 * Everything after the AI core (capabilities, process, pricing, FAQ, footer) is new copy
 * written in the same voice; prices and plan limits are placeholders.
 */

export const brand = {
  name: "Sorvine",
  legalName: "Sorvine",
  tagline: "AI models and agents built around the way your company works.",
};

export const nav = {
  links: [
    { label: "Home", href: "#top" },
    { label: "Product", href: "#product" },
    { label: "Services", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "About us", href: "#intent" },
    { label: "Research", href: "#core" },
  ],
  language: "EN",
  login: { label: "Log in", href: "#contact" },
};

export const hero = {
  eyebrow: "AI models & agents",
  titleLight: "Turn Your Data Into",
  titleBold: "Your Smartest Teammate",
  // Two lines on desktop, as in the design; they flow together on small screens.
  body: [
    `${brand.name} builds AI models and agents around the way your company works,`,
    "so routine work runs on its own and every call has data behind it.",
  ],
  secondaryCta: { label: "Learn more", href: "#intent" },
  primaryCta: { label: "Get started", href: "#pricing" },
  scrollHint: "Scroll down",
};

/**
 * Scroll cues. `at` is the scroll position (in screens) each chapter jumps to; the hints
 * fade in when a visitor pauses on a pinned scene and tell them what the next scroll shows.
 */
export const scrollCues = {
  chapters: [
    { label: "Intro", at: 0 },
    { label: "Intent", at: 1.7 },
    { label: "Learn", at: 3.95 },
    { label: "Reason", at: 5.55 },
    { label: "Act", at: 7.1 },
  ],
  hints: [
    { from: 1.3, to: 2.3, text: "Scroll to meet your AI core" },
    { from: 3.7, to: 4.4, text: "Scroll to see it reason" },
    { from: 5.1, to: 6.0, text: "Scroll to see it act" },
    { from: 6.65, to: 7.6, text: "Scroll to see what we build" },
  ],
  processHint: "Keep scrolling through the steps",
};

export const intent = {
  eyebrow: "Powered by AI",
  titleLight: "Human intent,",
  titleBold: "machine intelligence.",
  body: ["AI that learns from every interaction and acts in", "real time, so your team can focus on what matters."],
};

export const core = {
  eyebrow: "Your AI core",
  titleLight: "Your business in",
  titleBold: "the palm of your hand.",
  steps: [
    {
      label: "Learn",
      body: "Every interaction, document and decision becomes context, so your models understand the business the way your team does.",
    },
    {
      label: "Reason",
      body: "Models weigh every signal against your goals, compare the options and show their reasoning before anything moves.",
    },
    {
      label: "Act",
      body: "Agents carry each decision through in real time, across the tools you already use, and learn from every outcome.",
    },
  ],
};

export const capabilities = {
  eyebrow: "What we build",
  titleLight: "Models that know your business,",
  titleBold: "agents that do the work.",
  body: "One platform for the whole loop: we train the model, wire it into your stack and keep it improving after launch.",
  items: [
    {
      icon: "models",
      title: "Custom models",
      body: "Trained on your documents, tickets and decisions, so answers sound like your team and not like the internet.",
    },
    {
      icon: "agents",
      title: "Autonomous agents",
      body: "Agents pick up routine work end to end: triage, follow-ups, reconciliation and reporting.",
    },
    {
      icon: "stack",
      title: "Works with your stack",
      body: "Connects to the CRM, help desk, data warehouse and chat tools you already run.",
    },
    {
      icon: "shield",
      title: "Private by default",
      body: "Isolated deployments, role-based access and full audit trails. Your data never trains anyone else's model.",
    },
  ],
} as const;

export const process = {
  eyebrow: "How it works",
  titleLight: "From raw data",
  titleBold: "to a working teammate.",
  steps: [
    { title: "Connect", body: "Securely link your data sources and tools. Read-only by default, with every permission explicit." },
    { title: "Train", body: "We fine-tune models on your workflows, vocabulary and edge cases, with your experts in the loop." },
    { title: "Deploy", body: "Agents go live inside the tools your team already uses, with clear guardrails and approvals." },
    { title: "Improve", body: "Every outcome feeds back into the system, so it gets sharper week after week." },
  ],
};

export const pricing = {
  eyebrow: "Pricing",
  titleLight: "Simple plans",
  titleBold: "that scale with you.",
  yearlyDiscountLabel: "Save 20%",
  plans: [
    {
      name: "Starter",
      monthly: 499,
      blurb: "For teams automating their first workflows.",
      features: ["1 custom model", "Up to 3 agents", "5 integrations", "Email support"],
      cta: "Start with Starter",
      featured: false,
    },
    {
      name: "Growth",
      monthly: 1490,
      blurb: "For companies running AI across departments.",
      features: ["5 custom models", "Unlimited agents", "All integrations", "Priority support", "SSO and audit logs"],
      cta: "Get started",
      featured: true,
    },
    {
      name: "Enterprise",
      monthly: null,
      blurb: "For organizations with advanced security and scale needs.",
      features: ["Dedicated deployment", "VPC or on-prem", "Custom SLAs", "Dedicated engineering team"],
      cta: "Talk to sales",
      featured: false,
    },
  ],
};

export const faq = {
  eyebrow: "FAQ",
  titleLight: "Questions,",
  titleBold: "answered.",
  items: [
    {
      q: "How long does it take to get started?",
      a: "Most teams connect their first data sources in a day and have a pilot agent running within a few weeks. We scope the first workflow with you before anything is built.",
    },
    {
      q: "Do we need an in-house ML team?",
      a: "No. We handle training, evaluation and deployment. Your domain experts review outputs and approve what the agents are allowed to do.",
    },
    {
      q: "Where does our data live?",
      a: "In an isolated environment dedicated to your company, or inside your own cloud on the Enterprise plan. Access is role-based and every action is logged.",
    },
    {
      q: "Which tools do you integrate with?",
      a: "Common CRMs, help desks, data warehouses, document stores and chat tools out of the box, plus custom APIs when you need them.",
    },
    {
      q: "Can we start small?",
      a: "Yes. Start with one workflow on the Starter plan and expand once the numbers speak for themselves.",
    },
  ],
};

export const cta = {
  eyebrow: "Get started",
  titleLight: "Ready to meet",
  titleBold: "your smartest teammate?",
  body: "Tell us about the work that slows your team down. We'll show you what it looks like when it runs on its own.",
  secondary: { label: "Book a demo", href: "#contact" },
  primary: { label: "Get started", href: "#pricing" },
};

export const footer = {
  newsletterLabel: "Product updates, once a month.",
  columns: [
    { title: "Product", links: ["Platform", "Models", "Agents", "Integrations", "Pricing"] },
    { title: "Company", links: ["About us", "Research", "Careers", "Contact"] },
    { title: "Resources", links: ["Docs", "Blog", "Security", "Status"] },
  ],
  legal: ["Privacy", "Terms", "Cookies"],
  year: 2026,
};
