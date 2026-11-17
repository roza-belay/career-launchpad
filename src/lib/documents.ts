/** Cover letters, recruiter message templates and profile links. Pure helpers only (tested). */

export const TEMPLATE_KINDS = ["LINKEDIN_CONNECT", "RECRUITER_CONTACT", "DIRECT_APPLICATION", "FOLLOW_UP", "THANK_YOU"] as const;
export type TemplateKind = (typeof TEMPLATE_KINDS)[number];

export type PresetTemplate = { kind: TemplateKind; title: string; body: string };

/** Built-in starting points the user copies into an editable, private row. Placeholders: {name} {company} {title}. */
export function presetTemplates(lang: "sv" | "en"): PresetTemplate[] {
  if (lang === "sv") {
    return [
      {
        kind: "LINKEDIN_CONNECT",
        title: "LinkedIn-kontaktförfrågan",
        body: "Hej {name},\n\nJag heter Roza och är frontendutvecklare med fokus på React och TypeScript. Jag såg din profil och skulle gärna knyta kontakt — jag följer gärna vad ni bygger på {company}.\n\nVänliga hälsningar,\nRoza",
      },
      {
        kind: "RECRUITER_CONTACT",
        title: "Kontakta rekryterare",
        body: "Hej {name},\n\nJag är frontendutvecklare (React, TypeScript, Tailwind) med en fullstack-praktik bakom mig och söker nu min första dedikerade frontendroll. Jag såg att du rekryterar till {company} och undrar om ni har roller som passar en junior frontendprofil.\n\nJag skickar gärna mitt CV och berättar mer.\n\nVänliga hälsningar,\nRoza",
      },
      {
        kind: "DIRECT_APPLICATION",
        title: "Spontanansökan till företag",
        body: "Hej,\n\nJag heter Roza och är frontendutvecklare med utbildning inom frontendutveckling och websäkerhet samt praktik inom fullstack-utveckling. Jag är mycket intresserad av {company} och undrar om ni har behov av en junior frontendutvecklare, nu eller framöver.\n\nJag bifogar mitt CV och visar gärna mina projekt.\n\nVänliga hälsningar,\nRoza",
      },
      {
        kind: "FOLLOW_UP",
        title: "Uppföljning efter ansökan",
        body: "Ämne: Uppföljning av min ansökan – {title}\n\nHej {name},\n\nJag hoppas att du mår bra. Jag sökte tjänsten som {title} på {company} och vill gärna följa upp och bekräfta mitt fortsatta intresse.\n\nHör gärna av dig om du behöver något mer från mig.\n\nVänliga hälsningar,\nRoza",
      },
      {
        kind: "THANK_YOU",
        title: "Tackmeddelande efter intervju",
        body: "Ämne: Tack för intervjun – {title}\n\nHej {name},\n\nTack för att du tog dig tid att träffa mig om rollen som {title} på {company}. Det var intressant att höra mer om teamet, och jag är ännu mer motiverad av möjligheten.\n\nJag ser fram emot att höra om nästa steg.\n\nVänliga hälsningar,\nRoza",
      },
    ];
  }
  return [
    {
      kind: "LINKEDIN_CONNECT",
      title: "LinkedIn connection request",
      body: "Hi {name},\n\nI'm Roza, a frontend developer focused on React and TypeScript. I came across your profile and would love to connect — I enjoy following what your team at {company} is building.\n\nKind regards,\nRoza",
    },
    {
      kind: "RECRUITER_CONTACT",
      title: "Contacting a recruiter",
      body: "Hi {name},\n\nI'm a frontend developer (React, TypeScript, Tailwind) with a fullstack internship behind me, now looking for my first dedicated frontend role. I saw that you recruit for {company} and wondered whether you have roles suited to a junior frontend profile.\n\nI'd be happy to send my CV and tell you more.\n\nKind regards,\nRoza",
    },
    {
      kind: "DIRECT_APPLICATION",
      title: "Direct application to a company",
      body: "Hello,\n\nMy name is Roza and I'm a frontend developer trained in frontend development and web security, with internship experience in fullstack development. I'm very interested in {company} and wondered whether you have a need for a junior frontend developer, now or in the future.\n\nI've attached my CV and would be glad to show my projects.\n\nKind regards,\nRoza",
    },
    {
      kind: "FOLLOW_UP",
      title: "Following up after an application",
      body: "Subject: Following up on my application – {title}\n\nHi {name},\n\nI hope you're well. I applied for the {title} position at {company} and wanted to follow up to reaffirm my interest.\n\nPlease let me know if you need anything further from me.\n\nKind regards,\nRoza",
    },
    {
      kind: "THANK_YOU",
      title: "Thank-you message after an interview",
      body: "Subject: Thank you – {title} interview\n\nHi {name},\n\nThank you for taking the time to speak with me about the {title} role at {company}. I enjoyed learning more about the team and I'm even more excited about the opportunity.\n\nI look forward to hearing about the next steps.\n\nKind regards,\nRoza",
    },
  ];
}

/** "Roza Belay - Cover letter - Acme"-style safe file name (without extension). */
export function coverLetterFileName(name: string, company: string | null) {
  return [name, company ?? ""].map((s) => s.trim()).filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ") || "Cover letter";
}

/** http(s) URL or empty — used for profile links. */
export const isHttpUrl = (s: string) => !s.trim() || /^https?:\/\/\S+\.\S+/.test(s.trim());

/** Fills {name} {company} {title} placeholders for copying a template. */
export function fillTemplate(body: string, vars: { name?: string; company?: string; title?: string }) {
  return body
    .replaceAll("{name}", vars.name?.trim() || "…")
    .replaceAll("{company}", vars.company?.trim() || "…")
    .replaceAll("{title}", vars.title?.trim() || "…");
}
