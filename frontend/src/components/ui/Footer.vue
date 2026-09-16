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
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(19, 14, 35, 0.92);
  color: rgba(255, 255, 255, 0.7);
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
  color: #fff;
}

.footer-brand span {
  color: #d8b46a;
}

.site-footer p {
  margin: 0;
  font-family: "DM Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
