import { lazy, Suspense, useEffect, useState } from "react";
import { SIDEBAR_WIDTH } from "./layout";
import ThemeToggle, { type Theme } from "./ThemeToggle";
import CarLoader from "./CarLoader";
import { SECTIONS } from "./sections";
import Home from "./sections/Home";
import Skills from "./sections/Skills";
import Project from "./sections/Project";
import Resume from "./sections/Resume";
import Socials from "./sections/Socials";
import Trivia from "./sections/Trivia";

const DriveScene = lazy(() => import("./three/DriveScene"));

const SECTION_VIEWS = [Home, Skills, Project, Resume, Socials, Trivia] as const;

function dismissBootSplash() {
  const splash = document.getElementById("boot-splash");
  if (!splash || splash.classList.contains("is-out")) return;
  splash.classList.add("is-out");
  window.setTimeout(() => splash.remove(), 500);
}

function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [carReady, setCarReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [activeIndex]);

  // Hand off from the HTML splash to the React car loader as soon as App mounts.
  useEffect(() => {
    dismissBootSplash();
  }, []);

  useEffect(() => {
    if (!carReady) return;
    const id = window.setTimeout(() => setShowLoader(false), 700);
    return () => window.clearTimeout(id);
  }, [carReady]);

  const ActiveSection = SECTION_VIEWS[activeIndex] ?? Home;
  const isTrivia = SECTIONS[activeIndex]?.id === "trivia";

  return (
    <>
      {showLoader && (
        <CarLoader progress={loadProgress} ready={carReady} />
      )}
      <Suspense fallback={null}>
        <DriveScene
          theme={theme}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onLoadProgress={setLoadProgress}
          onLoadComplete={() => setCarReady(true)}
        />
      </Suspense>
      <ThemeToggle
        theme={theme}
        onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      <main
        style={{
          marginLeft: theme === "dark" ? SIDEBAR_WIDTH : 0,
          marginRight: theme === "light" ? SIDEBAR_WIDTH : 0,
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
