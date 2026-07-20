import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface HeatmapDay {
  date: string;
  github: number;
  leetcode: number;
  codeforces: number;
  total: number;
}

// A "result" union instead of separate loading/data/error booleans, so
// impossible states (e.g. loading AND error both true) can't happen.
type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; days: HeatmapDay[] };

// A GitHub-dark-mode-style intensity scale applied to each day's total
// activity across all 3 platforms.
function colorFor(total: number): string {
  if (total === 0) return "#161b22";
  if (total <= 2) return "#0e4429";
  if (total <= 5) return "#006d32";
  if (total <= 9) return "#26a641";
  return "#39d353";
}

type Range = "3m" | "6m" | "all";

// Filters relative to the *latest date in the data*, not the actual
// current date -- the last synced day might be yesterday, or the cache
// might be a bit stale, and we still want "3 months" to mean "the most
// recent 3 months of data we have", not silently return nothing.
function filterByRange(days: HeatmapDay[], range: Range): HeatmapDay[] {
  if (range === "all" || days.length === 0) return days;

  const monthsBack = range === "3m" ? 3 : 6;
  const cutoff = new Date(`${days[days.length - 1].date}T00:00:00Z`);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - monthsBack);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  return days.filter((day) => day.date >= cutoffISO);
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

interface MonthCalendar {
  label: string;
  weeks: (HeatmapDay | null)[][];
}

// Splits the flat day list into one calendar block per month, each laid
// out like a normal wall calendar: rows are weeks (Sun-Sat columns), with
// empty cells padding the front and back so the 1st lands under the right
// weekday.
function toMonthlyCalendars(days: HeatmapDay[]): MonthCalendar[] {
  const byMonth = new Map<string, HeatmapDay[]>();
  for (const day of days) {
    const monthKey = day.date.slice(0, 7); // "YYYY-MM"
    const bucket = byMonth.get(monthKey);
    if (bucket) {
      bucket.push(day);
    } else {
      byMonth.set(monthKey, [day]);
    }
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

interface RatingPoint {
  date: string;
  rating: number;
  label: string;
}

interface Ratings {
  leetcode: RatingPoint[];
  codeforces: RatingPoint[];
}

type RatingsFetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; ratings: Ratings };

const RATING_LOOKBACK_MONTHS = 24;
const X_TICK_MONTHS = 4;

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const CHART_PADDING = { top: 16, right: 16, bottom: 28, left: 42 };

function toEpochMs(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime();
}

// Keeps only points within `months` of `anchorMs`, so both platforms can be
// pinned to the exact same window (e.g. the last 2 years) rather than each
// picking its own independent range.
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

interface RatingSeries {
  label: string;
  color: string;
  points: RatingPoint[];
}

// A minimal hand-rolled line chart (points connected by a polyline, plus a
// circle marker per point) -- this is the same shape Codeforces' own rating
// graph uses. Multiple series are overlaid on one shared time/rating scale.
// Built in raw SVG rather than a charting library so each point/line stays
// a plain, individually animatable element for later GSAP work.
function CombinedRatingChart({ series }: { series: RatingSeries[] }) {
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return <p style={{ color: "#888" }}>no contest data</p>;
  }

  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const dates = allPoints.map((p) => toEpochMs(p.date));
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateSpan = maxDate - minDate || 1; // avoid divide-by-zero for a single point

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

  // A handful of evenly spaced Y gridlines across the shared rating range.
  const yTickCount = 4;
  const yTicks = Array.from(
    { length: yTickCount + 1 },
    (_, i) => minRating + (ratingSpan / yTickCount) * i,
  );

  // X-axis ticks every 4 months, starting from the earliest point's month.
  const xTicks: number[] = [];
  const tickCursor = new Date(minDate);
  tickCursor.setUTCDate(1);
  while (tickCursor.getTime() <= maxDate) {
    xTicks.push(tickCursor.getTime());
    tickCursor.setUTCMonth(tickCursor.getUTCMonth() + X_TICK_MONTHS);
  }

  return (
    <div>
      <svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {yTicks.map((rating) => (
          <g key={rating}>
            <line
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={yFor(rating)}
              y2={yFor(rating)}
              stroke="#222"
            />
            <text x={2} y={yFor(rating) - 3} fill="#888" fontSize={10}>
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
              stroke="#181818"
            />
            <text
              x={xFor(ms)}
              y={CHART_HEIGHT - 8}
              fill="#888"
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
                r={3.5}
                fill={s.color}
              >
                <title>{`${s.label} -- ${p.date}: ${p.rating} (${p.label})`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>

      <div style={{ display: "flex", gap: "1.25rem", marginTop: 4 }}>
        {series.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              color: "#ccc",
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

function App() {
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const [range, setRange] = useState<Range>("3m");
  const [ratingsState, setRatingsState] = useState<RatingsFetchState>({
    status: "idle",
  });

  async function handleFetchRatings() {
    setRatingsState({ status: "loading" });
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/ratings`);
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setRatingsState({ status: "success", ratings: body.data as Ratings });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setRatingsState({ status: "error", message });
    }
  }

  async function handleFetchHeatmap() {
    setState({ status: "loading" });
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/heatmap`);
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setState({ status: "success", days: body.data as HeatmapDay[] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", message });
    }
  }

  return (
    <>
      <h1>activity heatmap</h1>
      <button
        onClick={handleFetchHeatmap}
        disabled={state.status === "loading"}
      >
        {state.status === "loading" ? "fetching..." : "fetch heatmap"}
      </button>

      {state.status === "error" && (
        <p style={{ color: "crimson" }}>error: {state.message}</p>
      )}

      {state.status === "success" && (
        <>
          <div style={{ marginTop: "1rem" }}>
            <label>
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
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem",
              marginTop: "1rem",
            }}
          >
            {toMonthlyCalendars(filterByRange(state.days, range)).map(
              (month) => (
                <div key={month.label}>
                  <div
                    style={{
                      marginBottom: 6,
                      fontSize: "0.8rem",
                      color: "#888",
                    }}
                  >
                    {month.label}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    {month.weeks.map((week, weekIdx) => (
                      <div key={weekIdx} style={{ display: "flex", gap: 3 }}>
                        {week.map((day, dayIdx) => (
                          <div
                            key={dayIdx}
                            title={
                              day
                                ? `${day.date}: ${day.total} total (github ${day.github}, leetcode ${day.leetcode}, codeforces ${day.codeforces})`
                                : undefined
                            }
                            style={{
                              width: 11,
                              height: 11,
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
              ),
            )}
          </div>
        </>
      )}

      <h1 style={{ marginTop: "2.5rem" }}>contest ratings</h1>
      <button
        onClick={handleFetchRatings}
        disabled={ratingsState.status === "loading"}
      >
        {ratingsState.status === "loading" ? "fetching..." : "fetch ratings"}
      </button>

      {ratingsState.status === "error" && (
        <p style={{ color: "crimson" }}>error: {ratingsState.message}</p>
      )}

      {ratingsState.status === "success" &&
        (() => {
          const allDates = [
            ...ratingsState.ratings.leetcode,
            ...ratingsState.ratings.codeforces,
          ].map((p) => toEpochMs(p.date));
          const anchor = allDates.length > 0 ? Math.max(...allDates) : Date.now();

          return (
            <div style={{ marginTop: "1rem" }}>
              <CombinedRatingChart
                series={[
                  {
                    label: "leetcode",
                    color: "#ffa116",
                    points: filterLastMonths(
                      ratingsState.ratings.leetcode,
                      anchor,
                      RATING_LOOKBACK_MONTHS,
                    ),
                  },
                  {
                    label: "codeforces",
                    color: "#4d90fe",
                    points: filterLastMonths(
                      ratingsState.ratings.codeforces,
                      anchor,
                      RATING_LOOKBACK_MONTHS,
                    ),
                  },
                ]}
              />
            </div>
          );
        })()}
    </>
  );
}

export default App;
