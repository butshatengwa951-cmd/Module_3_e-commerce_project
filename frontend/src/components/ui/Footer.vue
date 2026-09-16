<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">STOCK<span>WELL</span></div>
      <p>Community first. Shared goals. Smarter buying.</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 48px;
  padding: 28px 24px;
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-soft);
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.footer-inner {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.footer-brand {
  font-family: "DM Mono", monospace;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text);
}

.footer-brand span {
  color: var(--gold);
}

.site-footer p {
  margin: 0;
  font-family: "DM Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-soft);
}

@media (max-width: 640px) {
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
