export const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "skills", label: "Skills" },
  { id: "project", label: "Project" },
  { id: "resume", label: "Resume" },
  { id: "socials", label: "Socials" },
  { id: "trivia", label: "Trivia" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
