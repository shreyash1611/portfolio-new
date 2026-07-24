const LINKS = [
  { label: "GitHub", href: "https://github.com/shreyash1611" },
  { label: "LeetCode", href: "https://leetcode.com/u/shreyashchaurasia" },
  {
    label: "Codeforces",
    href: "https://codeforces.com/profile/shreyashchaurasia",
  },
];

export default function Socials() {
  return (
    <section
      style={{
        textAlign: "center",
        maxWidth: "36rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ marginTop: 0 }}>socials</h1>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "1rem 0 0",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              {link.label} →
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
