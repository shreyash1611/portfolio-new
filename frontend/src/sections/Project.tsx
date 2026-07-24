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

export default function Project() {
  return (
    <section className="projects-page">
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
    </section>
  );
}
