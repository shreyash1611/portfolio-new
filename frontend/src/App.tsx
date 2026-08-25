import { lazy, Suspense, useEffect, useState } from "react";
import { SIDEBAR_WIDTH } from "./layout";
import ThemeToggle, { type Theme } from "./ThemeToggle";
import CarLoader from "./CarLoader";
import MobileNav from "./MobileNav";
import useCompactLayout from "./useCompactLayout";
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
  const compact = useCompactLayout();
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [carReady, setCarReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  document.documentElement.setAttribute(
    "data-layout",
    compact ? "compact" : "desktop",
  );

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

  const sceneReady = compact || carReady;
  const ActiveSection = SECTION_VIEWS[activeIndex] ?? Home;
  const isTrivia = SECTIONS[activeIndex]?.id === "trivia";

  return (
    <>
      {showLoader && (
        <CarLoader
          progress={compact ? 100 : loadProgress}
          ready={sceneReady}
          onExitComplete={() => setShowLoader(false)}
        />
      )}
      {!compact && (
        <Suspense fallback={null}>
          <DriveScene
            theme={theme}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            onLoadProgress={setLoadProgress}
            onLoadComplete={() => setCarReady(true)}
          />
        </Suspense>
      )}
      {compact && (
        <MobileNav
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />
      )}
      <ThemeToggle
        theme={theme}
        onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      <main
        className={`site-main${isTrivia ? " site-main--trivia" : ""}`}
        style={{
          marginLeft: compact ? 0 : theme === "dark" ? SIDEBAR_WIDTH : 0,
          marginRight: compact ? 0 : theme === "light" ? SIDEBAR_WIDTH : 0,
        }}
      >
        <ActiveSection key={SECTIONS[activeIndex].id} />
      </main>
    </>
  );
}

export default App;
