import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const SKILL_GROUPS = [
  {
    title: "Backend & Scripting",
    items: ["Go", "TypeScript", "C/C++", "Python", "Solidity", "Bash", "SQL"],
  },
  {
    title: "Front end",
    items: ["HTML", "GSAP", "TypeScript"],
  },
  {
    title: "Libraries",
    items: [
      "Pandas",
      "PySpark",
      "TensorFlow",
      "NumPy",
      "React.js",
      "Ethers.js",
    ],
  },
] as const;

interface HeatmapDay {
  date: string;
  github: number;
  leetcode: number;
  codeforces: number;
  total: number;
}

interface RatingPoint {
  date: string;
  rating: number;
  label: string;
}

interface PlatformProblems {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

interface CombinedStats {
  problemsSolved: {
    leetcode: PlatformProblems;
    codeforces: PlatformProblems;
  };
  ratings: {
    leetcode: RatingPoint[];
    codeforces: RatingPoint[];
  };
  heatmap: HeatmapDay[];
  profiles: {
    leetcode: {
      username: string;
      rating: number;
      globalRanking: number;
      attendedContests: number;
    };
    codeforces: {
      handle: string;
      rating: number;
      maxRating: number;
      rank: string;
      maxRank: string;
    };
  };
}

type FetchState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: CombinedStats };

type Range = "3m" | "6m" | "all";

function colorFor(total: number): string {
  if (total === 0) return "var(--heat-0)";
  if (total <= 2) return "var(--heat-1)";
  if (total <= 5) return "var(--heat-2)";
  if (total <= 9) return "var(--heat-3)";
  return "var(--heat-4)";
}

function filterByRange(days: HeatmapDay[], range: Range): HeatmapDay[] {
  if (range === "all" || days.length === 0) return days;
  const monthsBack = range === "3m" ? 3 : 6;
  const cutoff = new Date(`${days[days.length - 1].date}T00:00:00Z`);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - monthsBack);
  return days.filter((day) => day.date >= cutoff.toISOString().slice(0, 10));
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toMonthlyCalendars(days: HeatmapDay[]) {
  const byMonth = new Map<string, HeatmapDay[]>();
  for (const day of days) {
    const monthKey = day.date.slice(0, 7);
    const bucket = byMonth.get(monthKey);
    if (bucket) bucket.push(day);
    else byMonth.set(monthKey, [day]);
  }

  return [...byMonth.entries()].map(([monthKey, monthDays]) => {
    const [year, month] = monthKey.split("-").map(Number);
    const firstWeekday = new Date(`${monthDays[0].date}T00:00:00Z`).getUTCDay();
    const lastWeekday = new Date(
      `${monthDays[monthDays.length - 1].date}T00:00:00Z`,
    ).getUTCDay();
    const cells: (HeatmapDay | null)[] = [
      ...Array(firstWeekday).fill(null),
      ...monthDays,
      ...Array(6 - lastWeekday).fill(null),
    ];
    const weeks: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return { label: `${MONTH_NAMES[month - 1]} ${year}`, weeks };
  });
}

function toEpochMs(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function filterLastMonths(
  points: RatingPoint[],
  anchorMs: number,
  months: number,
): RatingPoint[] {
  const cutoff = new Date(anchorMs);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  const cutoffMs = cutoff.getTime();
  return points.filter((p) => toEpochMs(p.date) >= cutoffMs);
}

function maxOf(points: RatingPoint[]): number {
  if (points.length === 0) return 0;
  return Math.max(...points.map((p) => p.rating));
}

const CHART_WIDTH = 520;
const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 12, right: 12, bottom: 28, left: 38 };
const X_TICK_MONTHS = 4;
const RATING_LOOKBACK_MONTHS = 24;
/** Don't draw a continuous line across huge contest gaps — it looks broken. */
const MAX_SEGMENT_GAP_MS = 45 * 24 * 60 * 60 * 1000;

function polylineSegments(points: RatingPoint[]): RatingPoint[][] {
  if (points.length === 0) return [];
  const sorted = [...points].sort(
    (a, b) => toEpochMs(a.date) - toEpochMs(b.date),
  );
  const segments: RatingPoint[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (toEpochMs(curr.date) - toEpochMs(prev.date) > MAX_SEGMENT_GAP_MS) {
      segments.push([curr]);
    } else {
      segments[segments.length - 1].push(curr);
    }
  }
  return segments;
}

function CombinedRatingChart({
  leetcode,
  codeforces,
}: {
  leetcode: RatingPoint[];
  codeforces: RatingPoint[];
}) {
  const allDates = [...leetcode, ...codeforces].map((p) => toEpochMs(p.date));
  const anchor = allDates.length > 0 ? Math.max(...allDates) : Date.now();
  const series = [
    {
      label: "LeetCode",
      color: "#ffa116",
      points: filterLastMonths(leetcode, anchor, RATING_LOOKBACK_MONTHS),
    },
    {
      label: "Codeforces",
      color: "#4d90fe",
      points: filterLastMonths(codeforces, anchor, RATING_LOOKBACK_MONTHS),
    },
  ];
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return <p className="skills-status">No contest data</p>;
  }

  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const dates = allPoints.map((p) => toEpochMs(p.date));
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateSpan = maxDate - minDate || 1;
  const ratings = allPoints.map((p) => p.rating);
  const minRating = Math.min(...ratings) - 20;
  const maxRating = Math.max(...ratings) + 20;
  const ratingSpan = maxRating - minRating || 1;
  const xFor = (dateMs: number) =>
    CHART_PADDING.left + ((dateMs - minDate) / dateSpan) * innerWidth;
  const yFor = (rating: number) =>
    CHART_PADDING.top +
    innerHeight -
    ((rating - minRating) / ratingSpan) * innerHeight;

  const yTicks = Array.from(
    { length: 5 },
    (_, i) => minRating + (ratingSpan / 4) * i,
  );
  const xTicks: number[] = [];
  const tickCursor = new Date(minDate);
  tickCursor.setUTCDate(1);
  // Start at the first month boundary on/after minDate so the first label
  // isn't a half-month stub jammed against the axis.
  if (tickCursor.getTime() < minDate) {
    tickCursor.setUTCMonth(tickCursor.getUTCMonth() + 1);
  }
  while (tickCursor.getTime() <= maxDate) {
    xTicks.push(tickCursor.getTime());
    tickCursor.setUTCMonth(tickCursor.getUTCMonth() + X_TICK_MONTHS);
  }

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        style={{ maxWidth: CHART_WIDTH, display: "block" }}
      >
        {yTicks.map((rating) => (
          <g key={rating}>
            <line
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={yFor(rating)}
              y2={yFor(rating)}
              stroke="var(--border)"
            />
            <text
              x={2}
              y={yFor(rating) - 3}
              fill="var(--muted)"
              fontSize={10}
              fontFamily="Space Grotesk, sans-serif"
            >
              {Math.round(rating)}
            </text>
          </g>
        ))}
        {xTicks.map((ms) => (
          <g key={ms}>
            <line
              x1={xFor(ms)}
              x2={xFor(ms)}
              y1={CHART_PADDING.top}
              y2={CHART_HEIGHT - CHART_PADDING.bottom}
              stroke="var(--border)"
            />
            <text
              x={xFor(ms)}
              y={CHART_HEIGHT - 6}
              fill="var(--muted)"
              fontSize={9}
              textAnchor="middle"
              fontFamily="Space Grotesk, sans-serif"
            >
              {new Date(ms).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.label}>
            {polylineSegments(s.points).map((segment, segIdx) => (
              <polyline
                key={`${s.label}-seg-${segIdx}`}
                points={segment
                  .map((p) => `${xFor(toEpochMs(p.date))},${yFor(p.rating)}`)
                  .join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {s.points.map((p) => (
              <circle
                key={`${s.label}-${p.date}-${p.label}`}
                cx={xFor(toEpochMs(p.date))}
                cy={yFor(p.rating)}
                r={2.5}
                fill={s.color}
              >
                <title>{`${s.label} — ${p.date}: ${Math.round(p.rating)} (${p.label})`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="skills-chart-legend">
        {series.map((s) => (
          <div key={s.label}>
            <span
              className="skills-chart-legend__swatch"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
            {s.points.length === 0 ? " (none)" : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="skills-stat">
      <div className="skills-stat__value">{value}</div>
      <div className="skills-stat__label">{label}</div>
      {sub && <div className="skills-stat__sub">{sub}</div>}
    </div>
  );
}

const RANGE_OPTIONS: { id: Range; label: string }[] = [
  { id: "3m", label: "3 mo" },
  { id: "6m", label: "6 mo" },
  { id: "all", label: "All" },
];

export default function Skills() {
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const [range, setRange] = useState<Range>("3m");

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetch(`${API_BASE_URL}/api/stats/combined`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        setState({ status: "success", data: body.data as CombinedStats });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", message });
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="skills-page">
      <p className="skills-kicker">Capability</p>
      <h1 className="skills-title">Skills</h1>
      <p className="skills-lede">
        What I ship with, and the contest numbers behind it.
      </p>

      <div className="skills-layout">
        <div>
          {SKILL_GROUPS.map((group) => (
            <div key={group.title} className="skills-group">
              <h2 className="skills-group__label">{group.title}</h2>
              <ul className="skills-list">
                {group.items.map((item, i) => (
                  <li key={item}>
                    {item}
                    <span>{String(i + 1).padStart(2, "0")}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <div className="skills-metrics__head">
            <h2 className="skills-group__label" style={{ margin: 0 }}>
              Profiles
            </h2>
          </div>

          {state.status === "loading" && (
            <p className="skills-status">Loading stats…</p>
          )}
          {state.status === "error" && (
            <p className="skills-status skills-status--error">
              Error: {state.message}
            </p>
          )}
          {state.status === "success" && (
            <>
              <div className="skills-stat-grid">
                <SpecStat
                  label="LeetCode max"
                  value={Math.round(maxOf(state.data.ratings.leetcode))}
                  sub={`Now ${Math.round(state.data.profiles.leetcode.rating)}`}
                />
                <SpecStat
                  label="Codeforces max"
                  value={state.data.profiles.codeforces.maxRating}
                  sub={state.data.profiles.codeforces.maxRank}
                />
                <SpecStat
                  label="LeetCode solved"
                  value={state.data.problemsSolved.leetcode.total}
                  sub={`${state.data.problemsSolved.leetcode.easy}E · ${state.data.problemsSolved.leetcode.medium}M · ${state.data.problemsSolved.leetcode.hard}H`}
                />
                <SpecStat
                  label="Codeforces solved"
                  value={state.data.problemsSolved.codeforces.total}
                  sub={`${state.data.problemsSolved.codeforces.easy}E · ${state.data.problemsSolved.codeforces.medium}M · ${state.data.problemsSolved.codeforces.hard}H`}
                />
              </div>

              <div className="skills-block">
                <h3 className="skills-block__title">Contest ratings</h3>
                <CombinedRatingChart
                  leetcode={state.data.ratings.leetcode}
                  codeforces={state.data.ratings.codeforces}
                />
              </div>

              <div className="skills-block">
                <h3 className="skills-block__title">Activity</h3>
                <div className="skills-range" role="group" aria-label="Heatmap range">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={range === opt.id}
                      onClick={() => setRange(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="skills-heatmap">
                  {toMonthlyCalendars(
                    filterByRange(state.data.heatmap, range),
                  ).map((month) => (
                    <div key={month.label}>
                      <div className="skills-heatmap__month">{month.label}</div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        {month.weeks.map((week, weekIdx) => (
                          <div
                            key={weekIdx}
                            style={{ display: "flex", gap: 3 }}
                          >
                            {week.map((day, dayIdx) => (
                              <div
                                key={dayIdx}
                                title={
                                  day
                                    ? `${day.date}: ${day.total} total`
                                    : undefined
                                }
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 2,
                                  backgroundColor: day
                                    ? colorFor(day.total)
                                    : "transparent",
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
