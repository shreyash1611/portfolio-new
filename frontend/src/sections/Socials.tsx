const LINKS = [
  {
    id: "github",
    label: "GitHub",
    detail: "@shreyash1611",
    href: "https://github.com/shreyash1611",
    external: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    detail: "chaurasia-shreyash",
    href: "https://in.linkedin.com/in/chaurasia-shreyash",
    external: true,
  },
  {
    id: "leetcode",
    label: "LeetCode",
    detail: "@shreyashchaurasia",
    href: "https://leetcode.com/u/shreyashchaurasia",
    external: true,
  },
  {
    id: "codeforces",
    label: "Codeforces",
    detail: "@shreyashchaurasia",
    href: "https://codeforces.com/profile/shreyashchaurasia",
    external: true,
  },
  {
    id: "gmail",
    label: "Gmail",
    detail: "shreyashc1611@gmail.com",
    href: "mailto:shreyashc1611@gmail.com",
    external: false,
  },
] as const;

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="socials-icon">
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.486 2 12.021c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.021C22 6.486 17.523 2 12 2z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="socials-icon">
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z"
      />
    </svg>
  );
}

function LeetCodeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="socials-icon">
      <path
        fill="currentColor"
        d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.127 6.226l-3.647-3.65a1.374 1.374 0 0 0-1.94 0 1.374 1.374 0 0 0 0 1.941l4.601 4.604-8.086 8.088a1.373 1.373 0 0 0 0 1.94 1.374 1.374 0 0 0 1.94 0l8.087-8.087 4.601 4.601a1.374 1.374 0 0 0 1.941 0 1.375 1.375 0 0 0 0-1.94l-4.604-4.603 6.207-6.21A1.373 1.373 0 0 0 15.42.438a1.374 1.374 0 0 0-.938-.438z"
        transform="translate(2.2 1.1) scale(0.82)"
      />
      <path
        fill="currentColor"
        d="M16.5 18.2h4.2c.55 0 1 .45 1 1s-.45 1-1 1H14c-.55 0-1-.45-1-1s.45-1 1-1h.8V8.9c0-.55.45-1 1-1s1 .45 1 1v9.3z"
      />
    </svg>
  );
}

function CodeforcesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="socials-icon">
      <rect x="3" y="10" width="4.5" height="11" rx="1" fill="currentColor" />
      <rect x="9.75" y="3" width="4.5" height="18" rx="1" fill="currentColor" />
      <rect x="16.5" y="7" width="4.5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="socials-icon">
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4.2-8 5-8-5V6l8 5 8-5v2.2z"
      />
    </svg>
  );
}

const ICONS = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  leetcode: LeetCodeIcon,
  codeforces: CodeforcesIcon,
  gmail: GmailIcon,
} as const;

export default function Socials() {
  return (
    <section className="socials-page">
      <p className="socials-kicker">Connect</p>
      <h1 className="socials-title">Socials</h1>
      <p className="socials-lede">
        Profiles, contests, and a direct line — pick a channel.
      </p>

      <ul className="socials-grid">
        {LINKS.map((link) => {
          const Icon = ICONS[link.id];
          return (
            <li key={link.id}>
              <a
                className="socials-card"
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                <span className="socials-card__icon">
                  <Icon />
                </span>
                <span className="socials-card__text">
                  <span className="socials-card__label">{link.label}</span>
                  <span className="socials-card__detail">{link.detail}</span>
                </span>
                <span className="socials-card__arrow" aria-hidden>
                  →
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
