import { useState, type KeyboardEvent } from "react";

type Project = {
  id: string;
  title: string;
  stack: string[];
  index: string;
  href?: string;
  linkLabel?: string;
};

const PROJECTS: Project[] = [
  {
    id: "coin-flip",
    title: "Coin Flip",
    stack: ["Ethers.js", "Solidity", "MetaMask Login API"],
    index: "01",
    href: "https://coinflip-n1xt.onrender.com/",
    linkLabel: "Live demo",
  },
  {
    id: "order-book",
    title: "Quant Order Book Simulator",
    stack: ["C++", "gtest", "CMake"],
    index: "02",
    href: "https://github.com/shreyash1611/QuantDevOrderBook",
    linkLabel: "GitHub",
  },
  {
    id: "supply-chain",
    title: "Supply Chain Management",
    stack: [
      "MERN",
      "MongoDB Atlas",
      "OAuth2",
      "MetaMask",
      "Google Maps API",
    ],
    index: "03",
    href: "https://veritasbyshreyash.onrender.com/",
    linkLabel: "Live demo",
  },
  {
    id: "job-scraper",
    title: "Job Scraper",
    stack: ["Go", "n8n"],
    index: "04",
  },
  {
    id: "personal-site",
    title: "Personal Site",
    stack: ["TypeScript", "Go", "Three.js", "React", "GSAP"],
    index: "05",
    href: "https://github.com/shreyash1611/portfolio-new",
    linkLabel: "GitHub",
  },
  {
    id: "ml",
    title: "Machine Learning",
    stack: ["TBD"],
    index: "06",
  },
];

function ProjectCard({ title, stack, index, href, linkLabel }: Project) {
  const [flipped, setFlipped] = useState(false);

  function toggle() {
    setFlipped((v) => !v);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <div
      className={`project-card${flipped ? " project-card--flipped" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={
        flipped ? `${title}. Stack visible. Flip to hide.` : `${title}. Flip to show stack.`
      }
      onClick={toggle}
      onKeyDown={onKeyDown}
    >
      <div className="project-card__inner">
        <div
          className="project-card__face project-card__back"
          aria-hidden={flipped}
        >
          <div className="project-card__frame" aria-hidden />
          <div className="project-card__pattern" aria-hidden />
          <div className="project-card__ornament" aria-hidden>
            <span className="project-card__ornament-ring" />
            <span className="project-card__ornament-core" />
          </div>
          <h2 className="project-card__title">{title}</h2>
          <span className="project-card__index">{index}</span>
        </div>

        <div
          className="project-card__face project-card__front"
          aria-hidden={!flipped}
        >
          <p className="project-card__kicker">Stack</p>
          <ul className="project-card__stack">
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {href && (
            <a
              className="project-card__link"
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {linkLabel ?? "Open"} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const FLOAT_SKILLS = [
  { label: "Go", depth: 0, top: "8%", duration: 38, delay: -4 },
  { label: "TypeScript", depth: 1, top: "18%", duration: 52, delay: -12 },
  { label: "Python", depth: 2, top: "28%", duration: 68, delay: -20 },
  { label: "React.js", depth: 0, top: "38%", duration: 42, delay: -8 },
  { label: "GSAP", depth: 1, top: "48%", duration: 56, delay: -16 },
  { label: "C/C++", depth: 2, top: "58%", duration: 72, delay: -24 },
  { label: "SQL", depth: 0, top: "68%", duration: 40, delay: -2 },
  { label: "Solidity", depth: 1, top: "78%", duration: 50, delay: -18 },
  { label: "TensorFlow", depth: 2, top: "12%", duration: 64, delay: -30 },
  { label: "Bash", depth: 1, top: "32%", duration: 48, delay: -6 },
  { label: "NumPy", depth: 0, top: "52%", duration: 36, delay: -14 },
  { label: "Ethers.js", depth: 2, top: "72%", duration: 70, delay: -22 },
  { label: "Pandas", depth: 1, top: "22%", duration: 54, delay: -10 },
  { label: "HTML", depth: 0, top: "62%", duration: 44, delay: -28 },
  { label: "PySpark", depth: 2, top: "42%", duration: 66, delay: -1 },
] as const;

function SkillsDrift() {
  return (
    <div className="projects-drift" aria-hidden>
      {FLOAT_SKILLS.map((skill) => (
        <span
          key={skill.label}
          className={`projects-drift__chip projects-drift__chip--d${skill.depth}`}
          style={{
            top: skill.top,
            animationDuration: `${skill.duration}s`,
            animationDelay: `${skill.delay}s`,
          }}
        >
          {skill.label}
        </span>
      ))}
    </div>
  );
}

export default function Project() {
  return (
    <section className="projects-page">
      <SkillsDrift />
      <div className="projects-foreground">
        <p className="projects-kicker">Work</p>
        <h1 className="projects-title">Projects</h1>
        <p className="projects-lede">
          Six decks face down — click one to read the stack.
        </p>

        <div className="projects-grid">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
