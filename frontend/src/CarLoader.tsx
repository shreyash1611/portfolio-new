interface CarLoaderProps {
  progress: number;
  ready: boolean;
}

export default function CarLoader({ progress, ready }: CarLoaderProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={`car-loader${ready ? " car-loader--out" : ""}`}
      aria-busy={!ready}
      aria-live="polite"
    >
      <div className="car-loader__stage">
        <img
          className="car-loader__car"
          src="/e30-side.png?v=2"
          alt=""
          draggable={false}
        />
        <div className="car-loader__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="car-loader__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="car-loader__label">
          {ready ? "Ready" : `Loading ${pct}%`}
        </p>
      </div>
    </div>
  );
}
