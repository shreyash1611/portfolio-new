export default function Home() {
  return (
    <section
      style={{
        width: "100%",
        maxWidth: "42rem",
        minHeight: "calc(100vh - 7rem)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "2.5rem",
        paddingBottom: "2rem",
      }}
    >
      <header>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(2.4rem, 7vw, 4.5rem)",
            lineHeight: 1.1,
            margin: "0 0 0.75rem",
            color: "var(--accent)",
          }}
        >
          Shreyash
          <br />
          Chaurasia
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Backend · Machine Learning
        </p>
      </header>

      <div
        className="font-about"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.35rem",
          fontSize: "clamp(1.1rem, 2.2vw, 1.4rem)",
          lineHeight: 1.65,
          color: "var(--fg)",
        }}
      >
        <p style={{ margin: 0 }}>
          I work at Standard Chartered with about a year of professional
          experience, contributing to systems that move and shape data across
          the organization.
        </p>
        <p style={{ margin: 0 }}>
          Beyond that, I spend a lot of time on backend engineering —
          particularly in Go — building APIs, concurrent services, and tooling
          with an eye toward clarity and long-term maintainability.
        </p>
        <p style={{ margin: 0 }}>
          I am also developing a foundation in machine learning: studying core
          methods carefully and applying them to practical problems as I go.
        </p>
      </div>

      <div className="home-meta" style={{ marginTop: "0.5rem", textAlign: "center" }}>
        <div>
          <h2
            style={{
              margin: "0 0 0.5rem",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            Currently
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              lineHeight: 1.55,
              color: "var(--muted)",
            }}
          >
            Working at Standard Chartered as a data engineer, while continuing
            to grow as a backend engineer and expand into machine learning.
          </p>
        </div>
        <div>
          <h2
            style={{
              margin: "0 0 0.5rem",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            Outside work
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              lineHeight: 1.55,
              color: "var(--muted)",
            }}
          >
            Competitive programming, side projects in Go, and steady practice
            across algorithms and ML fundamentals.
          </p>
        </div>
      </div>
    </section>
  );
}
