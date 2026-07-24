import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LETTERS = ["T", "R", "I", "V", "I", "A"] as const;

const LETTER_COLORS = [
  "#ff5c8a",
  "#ffb020",
  "#3ddc97",
  "#5b8cff",
  "#ff7a45",
  "#c084fc",
];

const CHIPS = [
  { label: "Go backend", color: "#3ddc97" },
  { label: "React + GSAP", color: "#5b8cff" },
  { label: "Three.js", color: "#ff7a45" },
  { label: "Cursor", color: "#ff5c8a" },
];

export default function Trivia() {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (letters.length === 0) return;

    gsap.set(letters, {
      scale: 0,
      y: 48,
      opacity: 0,
      transformOrigin: "50% 100%",
      rotation: -12,
    });

    const tl = gsap.timeline();
    letters.forEach((letter, i) => {
      tl.to(
        letter,
        {
          keyframes: [
            {
              scale: 1.95,
              y: -26,
              opacity: 1,
              rotation: 8,
              duration: 0.28,
              ease: "power2.out",
            },
            {
              scale: 1,
              y: 0,
              rotation: 0,
              duration: 0.36,
              ease: "back.out(1.8)",
            },
          ],
        },
        i * 0.15,
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  // Pin + horizontal scrub: vertical wheel slides panels sideways. No content
  // below the pin, so once the last panel (credit) is reached, scrolling ends.
  useEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;

    const panels = Array.from(
      track.querySelectorAll<HTMLElement>(".trivia-panel"),
    );

    const sizePanels = () => {
      const width = pin.clientWidth;
      for (const panel of panels) {
        panel.style.width = `${width}px`;
      }
    };

    sizePanels();

    const getTravel = () => Math.max(0, track.scrollWidth - pin.clientWidth);

    const tween = gsap.to(track, {
      x: () => -getTravel(),
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: () => `+=${getTravel()}`,
        pin: true,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    const onResize = () => {
      sizePanels();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section className="trivia-page trivia-hscroll">
      <div className="trivia-blobs" aria-hidden>
        <span className="trivia-blob trivia-blob-a" />
        <span className="trivia-blob trivia-blob-b" />
        <span className="trivia-blob trivia-blob-c" />
      </div>

      <div ref={pinRef} className="trivia-pin">
        <div ref={trackRef} className="trivia-track">
          <article className="trivia-panel" id="trivia-intro">
            <p className="trivia-kicker">behind the scenes</p>
            <h1 aria-label="Trivia" className="trivia-title">
              {LETTERS.map((letter, i) => (
                <span
                  key={`${letter}-${i}`}
                  ref={(el) => {
                    letterRefs.current[i] = el;
                  }}
                  style={{
                    display: "inline-block",
                    willChange: "transform",
                    color: LETTER_COLORS[i],
                    textShadow: `0 4px 0 color-mix(in srgb, ${LETTER_COLORS[i]} 35%, black)`,
                  }}
                >
                  {letter}
                </span>
              ))}
            </h1>
            <p className="trivia-lead">
              Scroll to ride sideways through a few notes on how this portfolio
              came together.
            </p>
          </article>

          <article className="trivia-panel" id="trivia-built">
            <h2 className="trivia-heading" style={{ color: "#ffb020" }}>
              How it was built
            </h2>
            <p className="trivia-body">
              This site was built together — me, and an AI coding assistant in
              Cursor — over a stretch of evenings. We started with a Go backend
              that pulls live stats from GitHub, LeetCode, and Codeforces, then
              shaped a React frontend around a simple idea: drive through the
              pages instead of clicking a boring menu.
            </p>
          </article>

          <article className="trivia-panel" id="trivia-stack">
            <h2 className="trivia-heading" style={{ color: "#3ddc97" }}>
              The stack
            </h2>
            <p className="trivia-body">
              Go on the server. React and TypeScript on the client. GSAP for
              motion. Three.js for the little orange car. None of it was meant
              to be a framework museum — just the tools that made the idea feel
              alive.
            </p>
            <div className="trivia-chips">
              {CHIPS.map((chip) => (
                <span
                  key={chip.label}
                  style={{
                    fontFamily: '"Fredoka", sans-serif',
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "999px",
                    color: "#111",
                    background: chip.color,
                    boxShadow: `0 3px 0 color-mix(in srgb, ${chip.color} 55%, black)`,
                  }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </article>

          <article className="trivia-panel" id="trivia-car">
            <h2 className="trivia-heading" style={{ color: "#5b8cff" }}>
              The car
            </h2>
            <p className="trivia-body">
              The car on the navbar is a BMW E30 — an absolute classic. Compact,
              boxy, honest proportions. Still one of the most beautiful shapes
              BMW ever put on the road, and the right companion for moving
              through this site.
            </p>
          </article>

          <article className="trivia-panel" id="trivia-life">
            <h2 className="trivia-heading" style={{ color: "#ff7a45" }}>
              Music &amp; fashion
            </h2>
            <p className="trivia-body">
              Outside work, music and fashion take up a lot of my headspace. I
              care about how things sound and how they look — playlists,
              silhouettes, the small details that make an outfit or a track feel
              finished. That is the other half of how I spend time away from
              code.
            </p>
          </article>

          <article className="trivia-panel trivia-credit" id="trivia-credit">
            <p className="trivia-credit-line">
              Made with <span aria-hidden="true">🤍</span> by Shreyash Chaurasia
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
