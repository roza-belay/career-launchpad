export const CAREER_ROLES = ["juniorFrontend", "frontend", "juniorFullstack", "fullstack", "juniorBackend", "backend", "juniorSoftware", "software", "juniorAi", "ai", "juniorAndroid", "android", "qa", "tester", "support", "juniorIt"] as const;
export type CareerRole = typeof CAREER_ROLES[number];
export const CAREER_HEADLINE = "Junior Software Developer | Frontend & Full-Stack | Kotlin, React & TypeScript";
export const CAREER_SUMMARY = "Frontend Development graduate from Jensen Yrkeshögskola with a specialization in Web Security and practical internship experience as a Full-Stack Developer at Gardeco Affärssystem.\n\nTechnical background in React, JavaScript, TypeScript, HTML, CSS, Vue, Kotlin, Android development, payment terminal integrations, REST APIs, testing, debugging and technical documentation.\n\nInterested in frontend development, full-stack development, backend systems, software integrations and AI-powered applications.\n\nSeeking my first dedicated software development opportunity in Sweden, while remaining open to suitable opportunities across Europe.";
const patterns: Record<CareerRole, RegExp> = {
  juniorFrontend: /front[- ]?end/, frontend: /front[- ]?end/,
  juniorFullstack: /full[- ]?stack/, fullstack: /full[- ]?stack/,
  juniorBackend: /back[- ]?end/, backend: /back[- ]?end/,
  juniorSoftware: /software (developer|engineer)|mjukvaruutvecklare|systemutvecklare/, software: /software (developer|engineer)|mjukvaruutvecklare|systemutvecklare/,
  juniorAi: /\bai\b|artificial intelligence|machine learning/, ai: /\bai\b|artificial intelligence|machine learning/,
  juniorAndroid: /android/, android: /android/, qa: /\bqa\b.*automat|automat.*(test|qa)|testautomat/,
  tester: /software test|testare|\btester\b/, support: /application support|applikationssupport/, juniorIt: /\bit[- ]?(developer|utvecklare)\b/,
};
export function matchesCareerRoles(v: { title: string }, roles: string[]) {
  const title = v.title.toLowerCase();
  return !roles.length || roles.some((r) => {
    if (!CAREER_ROLES.some((role) => role === r)) return false;
    const role = r as CareerRole;
    return patterns[role].test(title) && (!role.startsWith("junior") || /\b(junior|entry[- ]level|graduate|trainee|juniora?)\b/.test(title));
  });
}
export function toggleCareerRole(roles: string[], role: CareerRole) {
  return roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
}