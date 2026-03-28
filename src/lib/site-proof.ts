export const founderProfile = {
  name: process.env.NEXT_PUBLIC_FOUNDER_NAME || "Meghal Parikh",
  role: process.env.NEXT_PUBLIC_FOUNDER_ROLE || "Founder, AEOSpark",
  bio:
    process.env.NEXT_PUBLIC_FOUNDER_BIO ||
    "AEOSpark is built to make AI visibility measurable, explainable, and actionable for teams that cannot afford to guess.",
  photoUrl: process.env.NEXT_PUBLIC_FOUNDER_PHOTO_URL || "",
  linkedInUrl: process.env.NEXT_PUBLIC_FOUNDER_LINKEDIN_URL || "",
};

export const pilotProof = {
  company: "AlphaWhale",
  stageLabel: "Pilot result",
  beforeCitationShare: "12%",
  afterCitationShare: "34%",
  timeframe: "45 days",
  note:
    "This proof block is based on a real pilot-style audit flow. The sample audit and case study show the structure of the paid deliverable and the kind of citation-share movement buyers care about.",
};
