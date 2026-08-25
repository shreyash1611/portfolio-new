import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface CarLoaderProps {
  progress: number;
  ready: boolean;
  onExitComplete?: () => void;
}

const MADE = "Made by";
const NAME = "Shreyash Chaurasia";

function CharSpans({
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

export default function CarLoader({
  progress,
  ready,
  onExitComplete,
}: CarLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, Math.max(0, Math.round(progress)));
  const introDoneRef = useRef(false);
  const readyRef = useRef(false);
  const exitingRef = useRef(false);
  const tryExitRef = useRef<() => void>(() => {});
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const madeChars = root.querySelectorAll(".car-loader__made-char");
    const nameChars = root.querySelectorAll(".car-loader__name-char");
    const line = root.querySelector(".car-loader__rule");
    const mark = root.querySelector(".car-loader__mark");
    const stage = root.querySelector(".car-loader__stage");
    const glow = root.querySelector(".car-loader__glow");

    const ctx = gsap.context(() => {
      gsap.set(madeChars, { y: 18, opacity: 0 });
      gsap.set(nameChars, { yPercent: 115, opacity: 0 });
      gsap.set(line, { scaleX: 0, opacity: 1 });
      gsap.set(mark, { scale: 0, rotation: -40, opacity: 0 });
      gsap.set(stage, { y: 28, opacity: 0 });
      gsap.set(glow, { opacity: 0, scale: 0.7 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          introDoneRef.current = true;
          tryExitRef.current();
        },
      });

      tl.to(glow, { opacity: 0.55, scale: 1, duration: 1.1, ease: "power2.out" }, 0)
        .to(
          madeChars,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.028,
            ease: "power2.out",
          },
          0.15,
        )
        .to(
          nameChars,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.032,
            ease: "power4.out",
          },
          0.35,
        )
        .to(
          mark,
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.55,
            ease: "back.out(1.8)",
          },
          0.7,
        )
        .to(
          line,
          {
            scaleX: 1,
            duration: 0.7,
            ease: "power3.inOut",
          },
          0.85,
        )
        .to(
          stage,
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power2.out",
          },
          0.95,
        );

      gsap.to(mark, {
        rotation: 360,
        duration: 8,
        ease: "none",
        repeat: -1,
        delay: 1.4,
      });

      gsap.to(glow, {
        opacity: 0.35,
        scale: 1.08,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.2,
      });
    }, root);

    tryExitRef.current = () => {
      if (!readyRef.current || !introDoneRef.current || exitingRef.current) return;
      exitingRef.current = true;

      gsap
        .timeline({
          defaults: { ease: "power2.in" },
          onComplete: () => onExitCompleteRef.current?.(),
        })
        .to(mark, { scale: 0, opacity: 0, duration: 0.28 }, 0)
        .to(
          nameChars,
          {
            yPercent: -110,
            opacity: 0,
            duration: 0.45,
            stagger: 0.018,
            ease: "power3.in",
          },
          0.05,
        )
        .to(madeChars, { y: -12, opacity: 0, duration: 0.3, stagger: 0.012 }, 0.08)
        .to(line, { scaleX: 0, duration: 0.35, ease: "power2.inOut" }, 0.1)
        .to(glow, { opacity: 0, scale: 1.2, duration: 0.4 }, 0.1)
        .to(
          stage,
          { y: 16, opacity: 0, duration: 0.4, ease: "power2.in" },
          0.18,
        )
        .to(root, { opacity: 0, duration: 0.35, ease: "power1.in" }, 0.35);
    };

    return () => {
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    readyRef.current = ready;
    if (ready) tryExitRef.current();
  }, [ready]);

  return (
    <div
      ref={rootRef}
      className="car-loader"
      aria-busy={!ready}
      aria-live="polite"
    >
      <div className="car-loader__glow" aria-hidden />

      <div className="car-loader__credit">
        <p className="car-loader__made" aria-label={MADE}>
          <CharSpans text={MADE} charClass="car-loader__made-char" />
        </p>

        <h1 className="car-loader__name" aria-label={NAME}>
          <CharSpans
            text={NAME}
            charClass="car-loader__name-char"
            maskClass="car-loader__name-mask"
          />
          <span className="car-loader__mark" aria-hidden>
            <svg viewBox="0 0 40 40" width="1em" height="1em">
              <path
                fill="currentColor"
                d="M20 2l2.4 12.2L34 10l-8.2 9.2L36 28l-12.4-2.2L20 38l-3.6-12.2L4 28l10.2-8.8L6 10l11.6 4.2z"
              />
            </svg>
          </span>
        </h1>

        <div className="car-loader__rule" aria-hidden />
      </div>

      <div className="car-loader__stage">
        <img
          className="car-loader__car"
          src="/e30-side.png?v=2"
          alt=""
          draggable={false}
        />
        <div
          className="car-loader__track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="car-loader__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="car-loader__label">
          {ready ? "Ready" : `Loading ${pct}%`}
        </p>
      </div>
    </div>
  );
}
