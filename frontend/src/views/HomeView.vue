<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-content">
        <div class="eyebrow"><span>●</span> COMMUNITY SHOPPING</div>

        <h1>
          Shop together.
          <span>Save together.</span>
        </h1>

        <p class="hero-text">
          StockWell helps stokvel groups combine their buying power,
          compare wholesale prices and save on everyday groceries.
        </p>

        <div class="hero-buttons">
          <RouterLink to="/catalogue" class="primary-button">
            Shop Groceries <span>→</span>
          </RouterLink>
          <a href="#how-it-works" class="secondary-button">How it works</a>
        </div>

        <div class="trust">
          <span>✓</span> Buy in groups
          <span>✓</span> Compare suppliers
          <span>✓</span> Save more
        </div>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="unity-orbit orbit-one"></div>
        <div class="unity-orbit orbit-two"></div>
        <div class="unity-core">🤝</div>

        <div class="floating-card floating-top">
          <span class="floating-icon">🤝</span>
          <div>
            <strong>Buy together</strong>
            <small>Stronger buying power</small>
          </div>
        </div>

        <div class="floating-card floating-bottom">
          <span class="floating-icon gold-icon">R</span>
          <div>
            <strong>Save together</strong>
            <small>Compare prices before buying</small>
          </div>
        </div>
      </div>
    </section>

    <section class="value-bar">
      <div class="value-item">
        <div class="value-number">01</div>
        <div>
          <strong>Group buying</strong>
          <span>Combine your group's needs</span>
        </div>
      </div>
      <div class="value-item">
        <div class="value-number purple">02</div>
        <div>
          <strong>Price comparison</strong>
          <span>See different supplier prices</span>
        </div>
      </div>
      <div class="value-item">
        <div class="value-number terra">03</div>
        <div>
          <strong>Bulk savings</strong>
          <span>Buy together as a group</span>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="how-section">
      <div class="section-heading">
        <span>HOW STOCKWELL WORKS</span>
        <h2>Simple shopping. <em>Shared savings.</em></h2>
        <p>
          Your stokvel does the shopping together, without everyone having to
          travel to the wholesaler.
        </p>
      </div>

      <div class="steps">
        <article class="step">
          <div class="step-number">01</div>
          <h3>Create your group</h3>
          <p>Start a stokvel group or join one you already belong to.</p>
        </article>
        <article class="step">
          <div class="step-number purple">02</div>
          <h3>Build your basket</h3>
          <p>Choose the groceries your group needs for the month.</p>
        </article>
        <article class="step">
          <div class="step-number terra">03</div>
          <h3>Compare prices</h3>
          <p>See prices from different suppliers before placing your order.</p>
        </article>
        <article class="step">
          <div class="step-number">04</div>
          <h3>Buy together</h3>
          <p>Combine the order and use your group's buying power.</p>
        </article>
      </div>
    </section>

    <section class="why-section">
      <div class="why-visual" aria-hidden="true">
        <div class="community-card">
          <span>STOCK</span>
          <strong>WELL</strong>
          <small>One group. One goal.</small>
        </div>
      </div>

      <div class="why-content">
        <span class="section-label">WHY STOCKWELL</span>
        <h2>Your money goes <span>further together.</span></h2>
        <p>
          StockWell is built around something stokvels already understand:
          when people contribute and work together, everyone can benefit.
        </p>

        <div class="benefits">
          <div class="benefit">
            <span>01</span>
            <div><strong>Compare suppliers</strong><small>Find the better price before buying.</small></div>
          </div>
          <div class="benefit">
            <span>02</span>
            <div><strong>Buy in bulk</strong><small>Use your group's combined demand.</small></div>
          </div>
          <div class="benefit">
            <span>03</span>
            <div><strong>Shop as one group</strong><small>One organised order instead of many trips.</small></div>
          </div>
        </div>
      </div>
    </section>

    <section class="final-cta">
      <div>
        <span>READY TO SHOP?</span>
        <h2>Bring your group together.</h2>
        <p>Start building your group's grocery basket.</p>
      </div>
      <RouterLink to="/catalogue" class="cta-button">Open Catalogue →</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--sw-page-background);
  color: var(--sw-page-text);
}

.hero {
  max-width: 1250px;
  margin: 0 auto;
  min-height: 620px;
  padding: 70px 35px;
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  align-items: center;
  gap: 50px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border: 1px solid var(--sw-input-border);
  border-radius: 30px;
  color: var(--sw-page-text-soft);
  font-size: 10px;
  letter-spacing: 0.12em;
  font-family: var(--sw-font-body);
}

.eyebrow span { color: var(--sw-gold-500); }

.hero h1 {
  max-width: 650px;
  margin: 22px 0;
  font-size: clamp(50px, 7vw, 82px);
  line-height: 0.92;
  letter-spacing: -0.07em;
}

.hero h1 span { display: block; color: var(--sw-purple-700); }

.hero-text {
  max-width: 530px;
  margin-bottom: 28px;
  color: var(--sw-page-text-soft);
  font-size: 16px;
  line-height: 1.7;
}

.hero-buttons { display: flex; gap: 12px; flex-wrap: wrap; }

.primary-button,
.secondary-button,
.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 21px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}

.primary-button {
  background: var(--sw-gold-500);
  color: var(--sw-purple-900);
}

.primary-button span { margin-left: 10px; }

.secondary-button {
  background: var(--sw-page-surface);
  color: var(--sw-page-text);
  border: 1px solid var(--sw-input-border);
}

.trust {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 24px;
  color: var(--sw-page-text-muted);
  font-size: 9px;
  font-family: var(--sw-font-body);
}

.trust span { color: var(--sw-gold-500); }

.hero-visual {
  position: relative;
  min-height: 470px;
  display: grid;
  place-items: center;
}

.unity-core {
  position: relative;
  z-index: 2;
  width: 300px;
  height: 300px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sw-glass-light);
  border: 1px solid var(--sw-glass-light-border);
  box-shadow: var(--sw-glass-shadow-light);
  backdrop-filter: blur(var(--sw-glass-blur));
  -webkit-backdrop-filter: blur(var(--sw-glass-blur));
  font-size: 96px;
}

.orbit-one,
.orbit-two {
  position: absolute;
  border-radius: 50%;
  filter: blur(4px);
  opacity: 0.55;
}

.orbit-one {
  width: 390px;
  height: 390px;
  background: radial-gradient(circle at 30% 35%, rgba(200,176,25,.65), transparent 48%), radial-gradient(circle at 70% 65%, rgba(121,93,137,.55), transparent 50%);
}

.orbit-two {
  width: 450px;
  height: 450px;
  border: 1px solid rgba(194,88,61,.25);
}

.floating-card {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--sw-page-surface);
  border: 1px solid var(--sw-input-border);
  padding: 12px 15px;
  border-radius: 14px;
  box-shadow: var(--sw-glass-shadow-light);
  backdrop-filter: blur(14px);
}

.floating-card strong { display: block; font-size: 12px; }
.floating-card small { display: block; margin-top: 3px; color: var(--sw-page-text-muted); font-size: 9px; }

.floating-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  background: rgba(121,93,137,.16);
  border-radius: 50%;
}

.gold-icon { background: var(--sw-gold-500); color: var(--sw-purple-900); font-weight: 800; }
.floating-top { top: 45px; right: -5px; }
.floating-bottom { bottom: 55px; left: -5px; }

.value-bar {
  max-width: 1180px;
  margin: 0 auto 70px;
  padding: 0 35px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
}

.value-item {
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 15px;
  background: var(--sw-page-surface);
  border: 1px solid var(--sw-input-border);
}

.value-item:first-child { border-radius: 14px 0 0 14px; }
.value-item:last-child { border-radius: 0 14px 14px 0; }

.value-number,
.step-number {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--sw-gold-500);
  color: var(--sw-purple-900);
  font-family: var(--sw-font-body);
  font-size: 10px;
}

.value-number.purple,
.step-number.purple { background: var(--sw-purple-700); color: #fff; }
.value-number.terra,
.step-number.terra { background: var(--sw-orange-600); color: #fff; }

.value-item strong { display: block; font-size: 12px; }
.value-item span { display: block; color: var(--sw-page-text-muted); font-size: 10px; margin-top: 3px; }

.how-section {
  max-width: 1180px;
  margin: auto;
  padding: 70px 35px;
}

.section-heading { max-width: 580px; margin-bottom: 38px; }
.section-heading > span,
.section-label { color: var(--sw-purple-700); font-family: var(--sw-font-body); font-size: 10px; letter-spacing: 0.12em; }
.section-heading h2,
.why-content h2 { font-size: clamp(32px, 5vw, 50px); line-height: 1; letter-spacing: -0.06em; margin: 12px 0; }
.section-heading h2 em { color: var(--sw-purple-700); font-style: normal; }
.section-heading p,
.why-content > p { color: var(--sw-page-text-soft); line-height: 1.6; font-size: 13px; }

.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.step { background: var(--sw-page-surface); border: 1px solid var(--sw-input-border); border-radius: 16px; padding: 22px; min-height: 190px; }
.step h3 { margin-top: 28px; font-size: 15px; }
.step p { color: var(--sw-page-text-muted); font-size: 11px; line-height: 1.6; }

.why-section {
  max-width: 1180px;
  margin: 30px auto 70px;
  padding: 35px;
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 55px;
  align-items: center;
}

.why-visual {
  min-height: 350px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: var(--sw-page-gradient);
  overflow: hidden;
}

.community-card { text-align: center; color: #fff; font-family: var(--sw-font-body); }
.community-card span { display: block; font-size: 1.2rem; letter-spacing: 0.15em; }
.community-card strong { display: block; margin-top: 6px; font-size: 4rem; line-height: 1; color: var(--sw-gold-500); }
.community-card small { display: block; margin-top: 16px; opacity: .75; }
.why-content h2 span { color: var(--sw-purple-700); display: block; }

.benefits { margin-top: 28px; display: grid; gap: 12px; }
.benefit { display: flex; gap: 16px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--sw-input-border); }
.benefit > span { color: var(--sw-gold-500); font-family: var(--sw-font-body); font-size: 11px; }
.benefit strong { display: block; font-size: 13px; }
.benefit small { display: block; margin-top: 4px; color: var(--sw-page-text-muted); font-size: 10px; }

.final-cta {
  max-width: 1180px;
  margin: 0 auto 70px;
  padding: 30px 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid var(--sw-input-border);
  border-radius: 22px;
  background: var(--sw-page-surface);
}

.final-cta > div > span { color: var(--sw-purple-700); font: 10px var(--sw-font-body); letter-spacing: 0.12em; }
.final-cta h2 { margin: 8px 0; font-size: clamp(28px, 4vw, 44px); letter-spacing: -0.05em; }
.final-cta p { margin: 0; color: var(--sw-page-text-muted); font-size: 12px; }
.cta-button { background: var(--sw-gold-500); color: var(--sw-purple-900); white-space: nowrap; }

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; min-height: auto; padding-top: 50px; }
  .hero-visual { min-height: 390px; }
  .value-bar, .steps { grid-template-columns: 1fr; }
  .value-item:first-child, .value-item:last-child { border-radius: 14px; }
  .why-section { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .hero, .how-section, .why-section, .final-cta { padding-left: 20px; padding-right: 20px; }
  .value-bar { padding: 0 20px; }
  .hero h1 { letter-spacing: -0.05em; }
  .unity-core { width: 230px; height: 230px; font-size: 70px; }
  .orbit-one { width: 300px; height: 300px; }
  .orbit-two { width: 330px; height: 330px; }
  .floating-top { right: 0; top: 20px; }
  .floating-bottom { left: 0; bottom: 20px; }
  .final-cta { flex-direction: column; align-items: flex-start; }
}
</style>
