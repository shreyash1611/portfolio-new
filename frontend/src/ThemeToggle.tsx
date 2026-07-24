export type Theme = "dark" | "light";

const BUTTON_SIZE = 56;
const MARGIN = 24;

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

// Dark: glowing moon parked on the right. Light: glowing sun parked on the
 // left. Clicking flips the theme; the button itself also slides across so
 // it always sits on the opposite side of the navbar.
export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      style={{
        position: "fixed",
        top: MARGIN,
        // Anchored left; dark mode slides it to the right edge via transform
        // so the browser handles resize without JS measuring window width.
        left: MARGIN,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        zIndex: 30,
        transform: isDark
          ? `translateX(calc(100vw - ${2 * MARGIN + BUTTON_SIZE}px))`
          : "translateX(0)",
        transition: "transform 0.8s ease",
      }}
    >
      <img
        src={isDark ? "/moon.png" : "/sun.png"}
        alt={isDark ? "moon" : "sun"}
        width={BUTTON_SIZE}
        height={BUTTON_SIZE}
        style={{
          display: "block",
          objectFit: "contain",
          imageRendering: "pixelated",
          filter: isDark
            ? "drop-shadow(0 0 8px rgba(200, 220, 255, 0.95)) drop-shadow(0 0 22px rgba(160, 190, 255, 0.65))"
            : "drop-shadow(0 0 10px rgba(255, 180, 40, 0.95)) drop-shadow(0 0 24px rgba(255, 120, 0, 0.55))",
          transition: "filter 0.8s ease",
        }}
      />
    </button>
  );
}
