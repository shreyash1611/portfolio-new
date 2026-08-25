import { SECTIONS } from "./sections";

interface MobileNavProps {
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

export default function MobileNav({
  activeIndex,
  onActiveIndexChange,
}: MobileNavProps) {
  const count = SECTIONS.length;
  const carLeft = `${((activeIndex + 0.5) / count) * 100}%`;

  return (
    <nav className="mobile-nav" aria-label="Sections">
      <div className="mobile-nav__items">
        {SECTIONS.map((section, i) => (
          <button
            key={section.id}
            type="button"
            className={
              i === activeIndex
                ? "mobile-nav__item is-active"
                : "mobile-nav__item"
            }
            aria-current={i === activeIndex ? "page" : undefined}
            onClick={() => onActiveIndexChange(i)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className="mobile-nav__road" aria-hidden>
        <div className="mobile-nav__lane" />
        <img
          className="mobile-nav__car"
          src="/e30-side.png?v=2"
          alt=""
          draggable={false}
          style={{ left: carLeft }}
        />
      </div>
    </nav>
  );
}
