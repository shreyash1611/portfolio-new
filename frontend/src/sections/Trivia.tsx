import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useCompactLayout from "../useCompactLayout";

gsap.registerPlugin(ScrollTrigger);

const STACK = ["Go backend", "React + GSAP", "Three.js", "Cursor"] as const;
const CREDIT_MADE = "Made by";
const CREDIT_NAME = "Shreyash Chaurasia";

function CreditChars({
  text,
  charClass,
  maskClass,
}: {
  text: string;
  charClass: string;
  maskClass?: string;
}) {
  return (
    <>
      {text.split("").map((char, i) => {
        const glyph = char === " " ? "\u00A0" : char;
        const inner = (
          <span className={charClass} key={`${charClass}-${i}`}>
            {glyph}
          </span>
        );
        if (!maskClass) return inner;
        return (
          <span className={maskClass} key={`${maskClass}-${i}`}>
            {inner}
          </span>
        );
      })}
    </>
  );
}

function AsteriskMark() {
  return (
    <span className="trivia-mark trivia-mark--asterisk" aria-hidden>
      <svg viewBox="0 0 40 40" width="1em" height="1em">
        <path
          fill="currentColor"
          d="M20 2l2.4 12.2L34 10l-8.2 9.2L36 28l-12.4-2.2L20 38l-3.6-12.2L4 28l10.2-8.8L6 10l11.6 4.2z"
        />
      </svg>
    </span>
  );
}

function BoltMark() {
  return (
    <span className="trivia-mark trivia-mark--bolt" aria-hidden>
      <svg viewBox="0 0 32 48" width="0.55em" height="0.85em">
        <path fill="currentColor" d="M18 0L4 26h10L8 48l20-30H16L26 0z" />
      </svg>
    </span>
  );
}

export default function Trivia() {
  const compact = useCompactLayout();
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const creditRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const parts = title.querySelectorAll(".trivia-title__part");
    const asterisk = title.querySelector(".trivia-mark--asterisk");
    const bolt = title.querySelector(".trivia-mark--bolt");

    gsap.set(parts, { y: 36, opacity: 0 });
    const tl = gsap.timeline();
    tl.to(parts, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      stagger: 0.07,
      ease: "power3.out",
    });

    const loops: gsap.core.Tween[] = [];
    if (asterisk) {
      loops.push(
        gsap.to(asterisk, {
          rotation: 360,
          duration: 7,
          ease: "none",
          repeat: -1,
          delay: 0.9,
        }),
      );
    }
    if (bolt) {
      loops.push(
        gsap.to(bolt, {
          rotateY: "+=180",
          duration: 0.55,
          ease: "power2.inOut",
          repeat: -1,
          repeatDelay: 1.45,
          delay: 1.1,
          transformPerspective: 400,
        }),
      );
    }

    return () => {
      tl.kill();
      for (const loop of loops) loop.kill();
    };
  }, []);

  useEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    const credit = creditRef.current;
    if (!pin || !track) return;

    const stacked = compact;

    const panels = Array.from(
      track.querySelectorAll<HTMLElement>(".trivia-panel"),
    );

    const sizePanels = () => {
      if (stacked) {
        for (const panel of panels) panel.style.width = "";
        return;
      }
      const width = pin.clientWidth;
      for (const panel of panels) {
        panel.style.width = `${width}px`;
      }
    };

    sizePanels();

    const getTravel = () => Math.max(0, track.scrollWidth - pin.clientWidth);

    let tween: gsap.core.Tween | null = null;
    if (!stacked) {
      tween = gsap.to(track, {
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
    } else {
      gsap.set(track, { x: 0 });
    }

    let creditTl: gsap.core.Timeline | null = null;
    let creditSpin: gsap.core.Tween | null = null;
    let creditTrigger: ScrollTrigger | null = null;

    if (credit) {
      const madeChars = credit.querySelectorAll(".trivia-credit-made-char");
      const nameChars = credit.querySelectorAll(".trivia-credit-name-char");
      const mark = credit.querySelector(".trivia-credit-mark");
      const rule = credit.querySelector(".trivia-credit-rule");
      const glow = credit.querySelector(".trivia-credit-glow");

      gsap.set(madeChars, { y: 16, opacity: 0 });
      gsap.set(nameChars, { yPercent: 120, opacity: 0 });
      gsap.set(mark, { scale: 0, rotation: -50, opacity: 0 });
      gsap.set(rule, { scaleX: 0 });
      gsap.set(glow, { opacity: 0, scale: 0.75 });

      const playCredit = () => {
        if (creditTl) return;
        creditTl = gsap.timeline({ defaults: { ease: "power3.out" } });
        creditTl
          .to(glow, { opacity: 0.5, scale: 1, duration: 0.9, ease: "power2.out" }, 0)
          .to(
            madeChars,
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.026,
              ease: "power2.out",
            },
            0.1,
          )
          .to(
            nameChars,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.03,
              ease: "power4.out",
            },
            0.28,
          )
          .to(
            mark,
            {
              scale: 1,
              rotation: 0,
              opacity: 1,
              duration: 0.55,
              ease: "back.out(1.9)",
            },
            0.65,
          )
          .to(
            rule,
            { scaleX: 1, duration: 0.65, ease: "power3.inOut" },
            0.75,
          );

        creditSpin = gsap.to(mark, {
          rotation: 360,
          duration: 7,
          ease: "none",
          repeat: -1,
          delay: 1.2,
        });
      };

      creditTrigger = ScrollTrigger.create({
        trigger: credit,
        containerAnimation: tween ?? undefined,
        start: stacked ? "top 82%" : "left 75%",
        once: true,
        onEnter: playCredit,
      });
    }

    const onResize = () => {
      sizePanels();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      creditTrigger?.kill();
      creditSpin?.kill();
      creditTl?.kill();
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, [compact]);

  return (
    <section className={`trivia-page trivia-hscroll${compact ? " trivia-page--stack" : ""}`}>
      <div ref={pinRef} className="trivia-pin">
        <div ref={trackRef} className="trivia-track">
          <article className="trivia-panel" id="trivia-intro">
            <p className="trivia-kicker">Behind the scenes</p>
            <h1 ref={titleRef} aria-label="Trivia" className="trivia-title">
              <span className="trivia-title__part">TR</span>
              <span className="trivia-title__part">
                <AsteriskMark />
              </span>
              <span className="trivia-title__part">V</span>
              <span className="trivia-title__part">
                <BoltMark />
              </span>
              <span className="trivia-title__part">A</span>
            </h1>
            <p className="trivia-lead">
              <span className="trivia-brace">{"{"}</span>
              <span className="trivia-lead__desk">
                Scroll sideways through a few notes on how this portfolio came
                together.
              </span>
              <span className="trivia-lead__phone">
                Scroll through a few notes on how this portfolio came together.
              </span>
              <span className="trivia-brace">{"}"}</span>
            </p>
          </article>

          <article className="trivia-panel" id="trivia-built">
            <h2 className="trivia-heading">How it was built</h2>
            <p className="trivia-body">
              This site was built by me, together with an AI coding assistant in
              Cursor for the frontend — over a stretch of evenings. I started with a Go backend
              that pulls live stats from GitHub, LeetCode, and Codeforces, then
              shaped a React frontend around a simple idea: drive through the
              pages instead of clicking a boring menu. I was supposed to enjoy building a website, learn new things for Front-End 
              development and build something that is useful.
            </p>
          </article>

          <article className="trivia-panel" id="trivia-stack">
            <h2 className="trivia-heading">The stack</h2>
            <p className="trivia-body">
              Go on the server. React and TypeScript on the client. GSAP for
              motion. Three.js for the little orange car. None of it was meant
              to be a framework museum — just the tools that made the idea feel
              alive.
            </p>
            <p className="trivia-stack-block" aria-label="Stack">
              <span className="trivia-brace">{"{"}</span>
              {STACK.map((item, i) => (
                <span key={item}>
                  {item}
                  {i < STACK.length - 1 ? " · " : ""}
                </span>
              ))}
              <span className="trivia-brace">{"}"}</span>
            </p>
          </article>

          <article className="trivia-panel" id="trivia-car">
            <h2 className="trivia-heading">The car</h2>
            <p className="trivia-body">
              The car on the nav is a BMW E30 — an absolute classic. Compact,
              boxy, honest proportions. Still one of the most beautiful shapes
              BMW ever put on the road, and the right companion for moving
              through this site.
            </p>
          </article>
            
          <article className="trivia-panel" id="trivia-life">
            <h2 className="trivia-heading">Music &amp; fashion</h2>
            <p className="trivia-body">
              Outside work, music and fashion take up a lot of my headspace. I
              care about how things sound and how they look — playlists,
              silhouettes, the small details that make an outfit or a track feel
              finished. That is the other half of how I spend time away from
              code.
            </p>
          </article>
          <article
            ref={creditRef}
            className="trivia-panel trivia-credit"
            id="trivia-credit"
          >
            <div className="trivia-credit-glow" aria-hidden />
            <p className="trivia-credit-made" aria-label={CREDIT_MADE}>
              <CreditChars
                text={CREDIT_MADE}
                charClass="trivia-credit-made-char"
              />
            </p>
            <h2 className="trivia-credit-name" aria-label={CREDIT_NAME}>
              <CreditChars
                text={CREDIT_NAME}
                charClass="trivia-credit-name-char"
                maskClass="trivia-credit-name-mask"
              />
              <span className="trivia-credit-mark" aria-hidden>
                <svg viewBox="0 0 40 40" width="1em" height="1em">
                  <path
                    fill="currentColor"
                    d="M20 2l2.4 12.2L34 10l-8.2 9.2L36 28l-12.4-2.2L20 38l-3.6-12.2L4 28l10.2-8.8L6 10l11.6 4.2z"
                  />
                </svg>
              </span>
            </h2>
            <div className="trivia-credit-rule" aria-hidden />
          </article>
        </div>
      </div>
    </section>
  );
}
