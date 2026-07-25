const RESUME_URL = "/Shreyash_Resume.pdf";

export default function Resume() {
  return (
    <section className="resume-page">
      <p className="resume-kicker">CV</p>
      <h1 className="resume-title">Resume</h1>
      <p className="resume-lede">
        One-pager — roles, stack, and the work behind the portfolio.
      </p>

      <div className="resume-actions">
        <a
          className="resume-download"
          href={RESUME_URL}
          download="Shreyash_Chaurasia_Resume.pdf"
        >
          Download PDF
          <span aria-hidden>→</span>
        </a>
        <a
          className="resume-open"
          href={RESUME_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open in browser
        </a>
      </div>
    </section>
  );
}
