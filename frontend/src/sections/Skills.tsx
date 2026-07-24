import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const SKILL_GROUPS = [
  {
    title: "Backend",
    items: ["Go", "TypeScript", "C/C++", "Python", "Solidity"],
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
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 12, bottom: 28, left: 42 };
const X_TICK_MONTHS = 4;
const RATING_LOOKBACK_MONTHS = 24;

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
      label: "leetcode",
      color: "#ffa116",
      points: filterLastMonths(leetcode, anchor, RATING_LOOKBACK_MONTHS),
    },
    {
      label: "codeforces",
      color: "#4d90fe",
      points: filterLastMonths(codeforces, anchor, RATING_LOOKBACK_MONTHS),
    },
  ];
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return <p style={{ color: "var(--muted)" }}>no contest data</p>;
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
  while (tickCursor.getTime() <= maxDate) {
    xTicks.push(tickCursor.getTime());
    tickCursor.setUTCMonth(tickCursor.getUTCMonth() + X_TICK_MONTHS);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        style={{ maxWidth: CHART_WIDTH }}
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
              y={CHART_HEIGHT - 8}
              fill="var(--muted)"
              fontSize={10}
              textAnchor="middle"
            >
              {new Date(ms).toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
                timeZone: "UTC",
              })}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.label}>
            <polyline
              points={s.points
                .map((p) => `${xFor(toEpochMs(p.date))},${yFor(p.rating)}`)
                .join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
            />
            {s.points.map((p) => (
              <circle
                key={`${s.label}-${p.date}-${p.label}`}
                cx={xFor(toEpochMs(p.date))}
                cy={yFor(p.rating)}
                r={3}
                fill={s.color}
              >
                <title>{`${s.label} — ${p.date}: ${Math.round(p.rating)} (${p.label})`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          marginTop: 4,
          justifyContent: "center",
        }}
      >
        {series.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              color: "var(--muted)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: s.color,
                display: "inline-block",
              }}
            />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: "6.5rem" }}>
      <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: "1.35rem", color: "var(--accent)" }}>{value}</div>
      {sub && (
        <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

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
    <section style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ marginTop: 0, textAlign: "center" }}>skills</h1>

      <div className="skills-layout">
        {/* Left: skill groups */}
        <div style={{ textAlign: "center" }}>
          {SKILL_GROUPS.map((group) => (
            <div key={group.title} style={{ marginBottom: "1.75rem" }}>
              <h2
                style={{
                  fontSize: "0.95rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  margin: "0 0 0.75rem",
                }}
              >
                {group.title}
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {group.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      color: "var(--fg)",
                      fontSize: "0.95rem",
                      padding: "0.35rem 0.6rem",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Right: live profile / contest stats */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "0.95rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent)",
              margin: "0 0 1rem",
            }}
          >
            profiles
          </h2>

          {state.status === "loading" && (
            <p style={{ color: "var(--muted)" }}>loading stats…</p>
          )}
          {state.status === "error" && (
            <p style={{ color: "crimson" }}>error: {state.message}</p>
          )}
          {state.status === "success" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <StatCard
                  label="LC max"
                  value={Math.round(maxOf(state.data.ratings.leetcode))}
                  sub={`now ${Math.round(state.data.profiles.leetcode.rating)}`}
                />
                <StatCard
                  label="CF max"
                  value={state.data.profiles.codeforces.maxRating}
                  sub={state.data.profiles.codeforces.maxRank}
                />
                <StatCard
                  label="LC solved"
                  value={state.data.problemsSolved.leetcode.total}
                  sub={`${state.data.problemsSolved.leetcode.easy}E / ${state.data.problemsSolved.leetcode.medium}M / ${state.data.problemsSolved.leetcode.hard}H`}
                />
                <StatCard
                  label="CF solved"
                  value={state.data.problemsSolved.codeforces.total}
                  sub={`${state.data.problemsSolved.codeforces.easy}E / ${state.data.problemsSolved.codeforces.medium}M / ${state.data.problemsSolved.codeforces.hard}H`}
                />
              </div>

              <h3 style={{ fontSize: "0.9rem", margin: "0 0 0.75rem" }}>
                contest ratings
              </h3>
              <CombinedRatingChart
                leetcode={state.data.ratings.leetcode}
                codeforces={state.data.ratings.codeforces}
              />

              <div
                style={{
                  marginTop: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <h3 style={{ fontSize: "0.9rem", margin: 0 }}>
                  activity heatmap
                </h3>
                <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  range:{" "}
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value as Range)}
                  >
                    <option value="3m">3 months</option>
                    <option value="6m">6 months</option>
                    <option value="all">all</option>
                  </select>
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1.25rem",
                    justifyContent: "center",
                  }}
                >
                  {toMonthlyCalendars(
                    filterByRange(state.data.heatmap, range),
                  ).map((month) => (
                    <div key={month.label}>
                      <div
                        style={{
                          marginBottom: 6,
                          fontSize: "0.75rem",
                          color: "var(--muted)",
                          textAlign: "center",
                        }}
                      >
                        {month.label}
                      </div>
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
