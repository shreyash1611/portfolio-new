import { useEffect, useState } from "react";
import DriveScene, { SIDEBAR_WIDTH } from "./three/DriveScene";
import ThemeToggle, { type Theme } from "./ThemeToggle";
import { SECTIONS } from "./sections";
import Home from "./sections/Home";
import Skills from "./sections/Skills";
import Project from "./sections/Project";
import Resume from "./sections/Resume";
import Socials from "./sections/Socials";
import Trivia from "./sections/Trivia";

const SECTION_VIEWS = [Home, Skills, Project, Resume, Socials, Trivia] as const;

function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [activeIndex]);

  const ActiveSection = SECTION_VIEWS[activeIndex] ?? Home;
  const isTrivia = SECTIONS[activeIndex]?.id === "trivia";

  return (
    <>
      <DriveScene
        theme={theme}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
      />
      <ThemeToggle
        theme={theme}
        onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      <main
        style={{
          marginLeft: theme === "dark" ? SIDEBAR_WIDTH : 0,
          marginRight: theme === "light" ? SIDEBAR_WIDTH : 0,
          // Trivia uses a full-viewport horizontal pin, so drop the usual
          // top padding that would fight ScrollTrigger's start: "top top".
          padding: isTrivia ? "0 1.25rem 0" : "5rem 2rem 2rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: isTrivia ? "stretch" : "center",
          transition: "margin 0.8s ease",
        }}
      >
        <ActiveSection key={SECTIONS[activeIndex].id} />
      </main>
    </>
  );
}

export default App;
