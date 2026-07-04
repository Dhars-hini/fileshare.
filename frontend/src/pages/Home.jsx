import React from "react";

const features = [
  { icon: "⬆️", title: "Easy Upload", desc: "Drag & drop or click to upload multiple files at once." },
  { icon: "⬇️", title: "Fast Download", desc: "Download any file instantly with a direct link." },
  { icon: "🔗", title: "Share Links", desc: "Generate unique share links to send files to anyone." },
  { icon: "🔒", title: "Secure", desc: "All files are protected behind your personal account." },
];

const Home = () => {
  return (
    <div style={styles.page}>
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            The simplest way to<br />
            <span style={styles.heroAccent}>upload & share files</span>
          </h1>
          <p style={styles.heroSub}>
            Store, download, and share files securely with a personal dashboard.
            No clutter, just your files — wherever you need them.
          </p>
          <div style={styles.heroBtns}>
            <a href="/register" style={styles.btnPrimary}>Get Started Free</a>
            <a href="/login" style={styles.btnSecondary}>Sign In</a>
          </div>
        </div>
        <div style={styles.heroIllustration}>📁</div>
      </section>

      {/* Features */}
      <section style={styles.features}>
        <h2 style={styles.featuresTitle}>Everything you need</h2>
        <div style={styles.featureGrid}>
          {features.map((f) => (
            <div key={f.title} style={styles.featureCard}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <h3 style={styles.featureCardTitle}>{f.title}</h3>
              <p style={styles.featureCardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to get started?</h2>
        <p style={styles.ctaSub}>Create a free account in seconds.</p>
        <a href="/register" style={styles.btnPrimary}>Create Account</a>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} FileShare. Built with ❤️</p>
      </footer>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
  },

  /* Hero */
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "5rem 1.5rem 4rem",
    gap: "2rem",
    flexWrap: "wrap",
  },
  heroContent: { flex: 1, minWidth: "260px" },
  heroTitle: {
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
    fontWeight: "800",
    color: "#1a1a2e",
    lineHeight: 1.25,
    margin: "0 0 1rem",
  },
  heroAccent: { color: "#e53935" },
  heroSub: {
    color: "#555",
    fontSize: "1rem",
    lineHeight: 1.7,
    marginBottom: "2rem",
    maxWidth: "480px",
  },
  heroBtns: { display: "flex", gap: "12px", flexWrap: "wrap" },
  heroIllustration: {
    fontSize: "8rem",
    lineHeight: 1,
    userSelect: "none",
  },

  /* Buttons */
  btnPrimary: {
    backgroundColor: "#e53935",
    color: "#fff",
    padding: "13px 28px",
    borderRadius: "8px",
    fontWeight: "700",
    textDecoration: "none",
    fontSize: "0.95rem",
    display: "inline-block",
    transition: "background 0.2s",
  },
  btnSecondary: {
    backgroundColor: "#fff",
    color: "#e53935",
    border: "2px solid #e53935",
    padding: "11px 26px",
    borderRadius: "8px",
    fontWeight: "700",
    textDecoration: "none",
    fontSize: "0.95rem",
    display: "inline-block",
  },

  /* Features */
  features: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "2rem 1.5rem 4rem",
  },
  featuresTitle: {
    textAlign: "center",
    fontSize: "1.6rem",
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: "2rem",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  featureCard: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "1.5rem",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    border: "1px solid #eee",
  },
  featureIcon: { fontSize: "2.2rem" },
  featureCardTitle: {
    color: "#1a1a2e",
    fontWeight: "700",
    fontSize: "1rem",
    margin: "10px 0 6px",
  },
  featureCardDesc: {
    color: "#888",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    margin: 0,
  },

  /* CTA Banner */
  cta: {
    backgroundColor: "#e53935",
    textAlign: "center",
    padding: "3.5rem 1.5rem",
  },
  ctaTitle: {
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: "800",
    margin: "0 0 8px",
  },
  ctaSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
  },

  /* Footer */
  footer: {
    textAlign: "center",
    padding: "1.5rem",
    color: "#aaa",
    fontSize: "0.85rem",
    backgroundColor: "#f0f2f5",
  },
};

export default Home;
