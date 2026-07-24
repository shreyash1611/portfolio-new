export default function Resume() {
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
      <h1 style={{ marginTop: 0 }}>resume</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
        Resume PDF coming soon — drop the file in{" "}
        <code>frontend/public/</code> and this button will download it.
      </p>
      <button type="button" disabled style={{ marginTop: "1rem" }}>
        download resume
      </button>
    </section>
  );
}
