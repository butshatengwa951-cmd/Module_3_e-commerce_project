<template>
  <div class="home-page" :class="theme">

    <!-- HERO -->
    <section class="hero">

      <div class="hero-content">

        <div class="eyebrow">
          <span>●</span>
          COMMUNITY SHOPPING
        </div>

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
            Shop Groceries
            <span>→</span>
          </RouterLink>

          <a href="#how-it-works" class="secondary-button">
            How it works
          </a>
        </div>

        <div class="trust">
          <span>✓</span> Buy in groups
          <span>✓</span> Compare suppliers
          <span>✓</span> Save more
        </div>

      </div>

      <!-- UNITY IMAGE -->
      <div class="hero-visual">

        <div class="image-circle">
          <img
            src="/images/unityHome.png"
            alt="People joining hands in unity"
            @error="handleImageError"
          />
        </div>

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


    <!-- SIMPLE VALUE BAR -->
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
          <span>Buy 10+ items together</span>
        </div>
      </div>

    </section>


    <!-- HOW IT WORKS -->
    <section id="how-it-works" class="how-section">

      <div class="section-heading">
        <span>HOW STOCKWELL WORKS</span>

        <h2>
          Simple shopping.
          <em>Shared savings.</em>
        </h2>

        <p>
          Your stokvel does the shopping together,
          without everyone having to travel to the wholesaler.
        </p>
      </div>


      <div class="steps">

        <div class="step">
          <div class="step-number">01</div>

          <h3>Create your group</h3>

          <p>
            Start a stokvel group or join one you already belong to.
          </p>
        </div>


        <div class="step">
          <div class="step-number purple">02</div>

          <h3>Build your basket</h3>

          <p>
            Choose the groceries your group needs for the month.
          </p>
        </div>


        <div class="step">
          <div class="step-number terra">03</div>

          <h3>Compare prices</h3>

          <p>
            See prices from different suppliers before placing your order.
          </p>
        </div>


        <div class="step">
          <div class="step-number">04</div>

          <h3>Buy together</h3>

          <p>
            Combine the order and use your group's buying power.
          </p>
        </div>

      </div>

    </section>


    <!-- WHY STOCKWELL -->
    <section class="why-section">

      <div class="why-image">
        <img
          src="/images/unityHome.png"
          alt="StockWell community"
          @error="handleImageError"
        />
      </div>

      <div class="why-content">

        <span class="section-label">
          WHY STOCKWELL
        </span>

        <h2>
          Your money goes
          <span>further together.</span>
        </h2>

        <p>
          StockWell is built around something stokvels already understand:
          when people contribute and work together, everyone can benefit.
        </p>

        <div class="benefits">

          <div class="benefit">
            <span>01</span>
            <div>
              <strong>Compare suppliers</strong>
              <small>Find the better price before buying.</small>
            </div>
          </div>

          <div class="benefit">
            <span>02</span>
            <div>
              <strong>Buy in bulk</strong>
              <small>Use your group's combined demand.</small>
            </div>
          </div>

          <div class="benefit">
            <span>03</span>
            <div>
              <strong>Shop as one group</strong>
              <small>One organised order instead of many trips.</small>
            </div>
          </div>

        </div>

      </div>

    </section>


    <!-- CTA -->
    <section class="final-cta">

      <div>
        <span>READY TO SHOP?</span>

        <h2>
          Bring your group together.
        </h2>

        <p>
          Start building your group's grocery basket.
        </p>
      </div>

      <RouterLink to="/catalogue" class="cta-button">
        Open Catalogue →
      </RouterLink>

    </section>

  </div>
</template>


<script setup>

defineProps({
  theme: {
    type: String,
    default: "light"
  }
});


function handleImageError(event) {
  event.target.src =
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=800&fit=crop";
}

</script>


<style scoped>

.home-page {
  --bg: #f5f1e8;
  --card: #ffffff;
  --text: #211a2d;
  --muted: #71687d;
  --gold: #c8b019;
  --purple: #795d89;
  --terra: #c2583d;
  --line: #ddd5e3;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "Space Grotesk", sans-serif;
}

.home-page.dark {
  --bg: #130e23;
  --card: #211a31;
  --text: #f4eff8;
  --muted: #aaa0b7;
  --line: rgba(255,255,255,0.12);
}


/* HERO */

.hero {
  max-width: 1250px;
  margin: auto;
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

  border: 1px solid var(--line);
  border-radius: 30px;

  font-family: "DM Mono", monospace;
  font-size: 10px;
  letter-spacing: 1px;
}

.eyebrow span {
  color: var(--gold);
}

.hero h1 {
  max-width: 650px;

  font-size: clamp(50px, 7vw, 82px);
  line-height: 0.92;

  letter-spacing: -4px;

  margin: 22px 0;
}

.hero h1 span {
  display: block;
  color: var(--purple);
}

.hero-text {
  max-width: 530px;

  color: var(--muted);

  font-size: 16px;
  line-height: 1.7;

  margin-bottom: 28px;
}

.hero-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-button,
.secondary-button {
  padding: 14px 21px;

  border-radius: 12px;

  text-decoration: none;

  font-size: 13px;
  font-weight: 700;
}

.primary-button {
  background: var(--gold);
  color: #211a2d;
}

.primary-button span {
  margin-left: 10px;
}

.secondary-button {
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--line);
}

.trust {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;

  margin-top: 24px;

  color: var(--muted);

  font-family: "DM Mono", monospace;
  font-size: 9px;
}

.trust span {
  color: #22a05a;
}


/* HERO IMAGE */

.hero-visual {
  position: relative;

  min-height: 470px;

  display: grid;
  place-items: center;
}

.image-circle {
  width: 390px;
  height: 390px;

  border-radius: 50%;

  overflow: hidden;

  border: 9px solid var(--card);

  box-shadow:
    0 25px 70px rgba(48, 35, 65, 0.18);
}

.image-circle img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.floating-card {
  position: absolute;

  display: flex;
  align-items: center;
  gap: 10px;

  background: var(--card);

  border: 1px solid var(--line);

  padding: 12px 15px;

  border-radius: 14px;

  box-shadow: 0 15px 35px rgba(40, 30, 55, 0.14);
}

.floating-card strong {
  display: block;
  font-size: 12px;
}

.floating-card small {
  display: block;

  margin-top: 3px;

  color: var(--muted);

  font-size: 9px;
}

.floating-icon {
  width: 34px;
  height: 34px;

  display: grid;
  place-items: center;

  background: #eee8f3;

  border-radius: 50%;

  font-size: 16px;
}

.gold-icon {
  background: var(--gold);
  color: #211a2d;

  font-weight: 800;
}

.floating-top {
  top: 45px;
  right: -5px;
}

.floating-bottom {
  bottom: 55px;
  left: -5px;
}


/* VALUE BAR */

.value-bar {
  max-width: 1180px;
  margin: 0 auto 70px;

  padding: 0 35px;

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
}

.value-item {
  background: var(--card);

  padding: 22px;

  display: flex;
  align-items: center;
  gap: 15px;

  border: 1px solid var(--line);
}

.value-item:first-child {
  border-radius: 14px 0 0 14px;
}

.value-item:last-child {
  border-radius: 0 14px 14px 0;
}

.value-number {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  background: var(--gold);

  border-radius: 50%;

  font-family: "DM Mono", monospace;
  font-size: 10px;
}

.value-number.purple {
  background: var(--purple);
  color: white;
}

.value-number.terra {
  background: var(--terra);
  color: white;
}

.value-item strong {
  display: block;
  font-size: 12px;
}

.value-item span {
  display: block;

  color: var(--muted);

  font-size: 10px;

  margin-top: 3px;
}


/* HOW IT WORKS */

.how-section {
  max-width: 1180px;
  margin: auto;

  padding: 70px 35px;
}

.section-heading {
  max-width: 580px;

  margin-bottom: 38px;
}

.section-heading > span,
.section-label {
  color: var(--purple);

  font-family: "DM Mono", monospace;
  font-size: 10px;
  letter-spacing: 1px;
}

.section-heading h2 {
  font-size: clamp(32px, 5vw, 50px);

  line-height: 1;

  letter-spacing: -2px;

  margin: 12px 0;
}

.section-heading h2 em {
  color: var(--purple);
  font-style: normal;
}

.section-heading p {
  color: var(--muted);

  line-height: 1.6;

  font-size: 13px;
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.step {
  background: var(--card);

  border: 1px solid var(--line);

  border-radius: 16px;

  padding: 22px;

  min-height: 190px;
}

.step-number {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  background: var(--gold);

  font-family: "DM Mono", monospace;
  font-size: 10px;
  font-weight: 700;
}

.step-number.purple {
  background: var(--purple);
  color: white;
}

.step-number.terra {
  background: var(--terra);
  color: white;
}

.step h3 {
  margin-top: 28px;

  font-size: 15px;
}

.step p {
  color: var(--muted);

  font-size: 11px;

  line-height: 1.6;
}


/* WHY */

.why-section {
  max-width: 1180px;
  margin: 30px auto 70px;

  padding: 35px;

  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 55px;

  align-items: center;
}

.why-image {
  height: 390px;

  border-radius: 25px;

  overflow: hidden;
}

.why-image img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.why-content h2 {
  font-size: clamp(32px, 4vw, 48px);

  line-height: 1;

  letter-spacing: -2px;

  margin: 15px 0;
}

.why-content h2 span {
  color: var(--gold);
}

.why-content > p {
  max-width: 500px;

  color: var(--muted);

  font-size: 13px;
  line-height: 1.7;

  margin-bottom: 25px;
}

.benefits {
  display: flex;
  flex-direction: column;
}

.benefit {
  display: flex;
  gap: 15px;

  padding: 15px 0;

  border-top: 1px solid var(--line);
}

.benefit > span {
  color: var(--purple);

  font-family: "DM Mono", monospace;
  font-size: 10px;
}

.benefit strong {
  display: block;

  font-size: 12px;
}

.benefit small {
  color: var(--muted);

  font-size: 10px;
}

/* CTA */

.final-cta {
  max-width: 1180px;
  margin: 0 auto 35px;

  padding: 35px;

  background: #1a102e;

  color: white;

  border-radius: 20px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 25px;
}

.final-cta > div > span {
  color: var(--gold);

  font-family: "DM Mono", monospace;
  font-size: 10px;
}

.final-cta h2 {
  font-size: 28px;

  margin: 8px 0;
}

.final-cta p {
  color: #bdb2ca;

  font-size: 12px;
}

.cta-button {
  background: var(--gold);

  color: #211a2d;

  padding: 14px 20px;

  border-radius: 12px;

  text-decoration: none;

  font-size: 12px;
  font-weight: 700;

  white-space: nowrap;
}


/* MOBILE */

@media (max-width: 900px) {

  .hero {
    grid-template-columns: 1fr;
    padding-top: 45px;
  }

  .hero-visual {
    min-height: 380px;
  }

  .image-circle {
    width: 300px;
    height: 300px;
  }

  .value-bar,
  .steps {
    grid-template-columns: 1fr;
  }

  .value-item:first-child,
  .value-item:last-child {
    border-radius: 0;
  }

  .value-item:first-child {
    border-radius: 14px 14px 0 0;
  }

  .value-item:last-child {
    border-radius: 0 0 14px 14px;
  }

  .why-section {
    grid-template-columns: 1fr;
  }

  .why-image {
    height: 300px;
  }

  .final-cta {
    margin: 20px;
    flex-direction: column;
    align-items: flex-start;
  }

}

@media (max-width: 600px) {

  .hero {
    padding: 35px 20px;
  }

  .hero h1 {
    letter-spacing: -2px;
  }

  .hero-visual {
    min-height: 330px;
  }

  .image-circle {
    width: 260px;
    height: 260px;
  }

  .floating-top {
    right: 0;
  }

  .floating-bottom {
    left: 0;
  }

  .value-bar,
  .how-section,
  .why-section {
    padding-left: 20px;
    padding-right: 20px;
  }

}

</style>