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
  border-top: 1px solid var(--sw-input-border);
  background: var(--sw-page-background);
  color: var(--sw-page-text-soft);
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
  font-family: var(--sw-font-body);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--sw-page-text);
}

.footer-brand span {
  color: var(--sw-gold-500);
}

.site-footer p {
  margin: 0;
  font-family: var(--sw-font-body);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--sw-page-text-soft);
}

@media (max-width: 640px) {
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
