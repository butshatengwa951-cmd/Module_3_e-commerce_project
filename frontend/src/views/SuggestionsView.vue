<template>
  <main class="suggestions-page">
    <section class="hero glass-panel">
      <div>
        <span class="eyebrow">MEMBER VOICE</span>
        <h1>Help us improve StockWell.</h1>
        <p>Send an idea, report a recurring problem, or suggest something that would make your Stokvel experience better.</p>
      </div>
      <div class="hero-badge">SUGGESTIONS</div>
    </section>

    <Transition name="notice">
      <div v-if="message" class="notice" role="status" aria-live="polite">{{ message }}</div>
    </Transition>

    <section class="card glass-panel">
      <div class="heading">
        <span class="eyebrow">NEW SUGGESTION</span>
        <h2>Share your idea</h2>
        <p>Every suggestion is sent to the StockWell admin team for review.</p>
      </div>

      <form @submit.prevent="submit">
        <label>
          <span>Subject</span>
          <input v-model="form.subject" maxlength="150" required placeholder="What would you like us to improve?" />
        </label>

        <label>
          <span>Category</span>
          <select v-model="form.category">
            <option v-for="category in categories" :key="category">{{ category }}</option>
          </select>
        </label>

        <label class="wide">
          <span>Suggestion</span>
          <textarea v-model="form.message" maxlength="2000" rows="7" required placeholder="Tell us what you would change and why..."></textarea>
        </label>

        <div class="form-footer">
          <small>{{ form.message.length }}/2000</small>
          <button :disabled="submitting" type="submit">
            {{ submitting ? 'Submitting…' : 'Submit suggestion' }}
          </button>
        </div>
      </form>
    </section>

    <section class="card glass-panel" v-if="suggestions.length">
      <div class="heading">
        <span class="eyebrow">MY SUBMISSIONS</span>
        <h2>Suggestion history</h2>
        <p>Track replies and status updates from the admin team.</p>
      </div>

      <article v-for="item in suggestions" :key="item.suggestion_id" class="suggestion">
        <div class="suggestion-top">
          <div>
            <strong>{{ item.subject }}</strong>
            <span>{{ item.category }} · {{ formatDate(item.created_at) }}</span>
          </div>
          <b :class="statusClass(item.status)">{{ item.status }}</b>
        </div>
        <p class="suggestion-message">{{ item.message }}</p>
        <div v-if="item.admin_response" class="response">
          <span>STOCKWELL RESPONSE</span>
          <p>{{ item.admin_response }}</p>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { createSuggestion, getMySuggestions } from "../services/api.js";

const categories = ["General", "Products", "Orders", "Delivery", "Stokvel", "Website"];
const form = reactive({ subject: "", category: "General", message: "" });
const suggestions = ref([]);
const message = ref("");
const submitting = ref(false);
let refreshTimer = null;

const notify = (text) => {
  message.value = text;
  window.setTimeout(() => { message.value = ""; }, 3500);
};

async function load() {
  try {
    const r = await getMySuggestions();
    suggestions.value = r.suggestions || [];
  } catch (e) {
    notify(e.response?.data?.message || "Unable to load suggestions.");
  }
}

async function submit() {
  submitting.value = true;
  try {
    const r = await createSuggestion(form);
    suggestions.value.unshift(r.suggestion);
    form.subject = "";
    form.category = "General";
    form.message = "";
    notify("Suggestion submitted. Thank you for helping improve StockWell.");
  } catch (e) {
    notify(e.response?.data?.message || "Unable to submit suggestion.");
  } finally {
    submitting.value = false;
  }
}

function formatDate(value) { return value ? new Date(value).toLocaleDateString() : "—"; }
function statusClass(status) { return status.toLowerCase().replace(/\s+/g, "-"); }
function refreshWhenVisible() { if (document.visibilityState === "visible") load(); }

onMounted(() => {
  load();
  refreshTimer = window.setInterval(load, 15000);
  document.addEventListener("visibilitychange", refreshWhenVisible);
});

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
  document.removeEventListener("visibilitychange", refreshWhenVisible);
});
</script>

<style scoped>
.suggestions-page {
  min-height: calc(100vh - 68px);
  padding: clamp(28px, 5vw, 58px) clamp(18px, 5vw, 72px) 70px;
  background:
    radial-gradient(circle at 12% 0%, rgba(208, 185, 91, 0.08), transparent 30%),
    radial-gradient(circle at 92% 14%, rgba(119, 88, 150, 0.10), transparent 28%),
    var(--sw-page-gradient);
  color: var(--sw-page-text);
  font-family: var(--sw-font-body);
}

.hero,
.card,
.notice {
  width: min(1050px, 100%);
  margin-inline: auto;
}

.glass-panel {
  border: 1px solid var(--sw-glass-light-border);
  background: var(--sw-glass-light);
  box-shadow: var(--sw-glass-shadow-light);
  backdrop-filter: blur(var(--sw-glass-blur)) saturate(var(--sw-glass-saturation));
  -webkit-backdrop-filter: blur(var(--sw-glass-blur)) saturate(var(--sw-glass-saturation));
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: clamp(24px, 4vw, 38px);
  border-radius: var(--sw-radius-xl);
}

.eyebrow {
  display: inline-block;
  margin-bottom: 9px;
  color: var(--sw-page-text-muted);
  font-size: var(--sw-text-xs);
  font-weight: 800;
  letter-spacing: 0.18em;
}

.hero h1 {
  margin: 0;
  max-width: 760px;
  color: var(--sw-page-text);
  font-size: clamp(2.3rem, 5vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
}

.hero p {
  max-width: 720px;
  margin: 16px 0 0;
  color: var(--sw-page-text-soft);
  font-size: var(--sw-text-lg);
  line-height: 1.7;
}

.hero-badge {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid var(--sw-gold-500);
  border-radius: var(--sw-radius-pill);
  background: rgba(200, 176, 25, 0.10);
  color: var(--sw-purple-900);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.notice {
  margin-top: 18px;
  padding: 13px 16px;
  border: 1px solid rgba(74, 128, 91, 0.28);
  border-radius: var(--sw-radius-md);
  background: rgba(94, 160, 111, 0.12);
  color: var(--sw-page-text);
  box-shadow: 0 12px 28px rgba(49, 43, 80, 0.06);
}

.notice-enter-active,
.notice-leave-active { transition: opacity .25s ease, transform .25s ease; }
.notice-enter-from,
.notice-leave-to { opacity: 0; transform: translateY(-8px); }

.card {
  margin-top: 22px;
  padding: clamp(22px, 4vw, 32px);
  border-radius: var(--sw-radius-xl);
}

.heading h2 {
  margin: 3px 0 0;
  color: var(--sw-page-text);
  font-size: clamp(1.45rem, 3vw, 2rem);
  letter-spacing: -0.035em;
}

.heading p {
  margin: 8px 0 0;
  color: var(--sw-page-text-soft);
  line-height: 1.6;
}

form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 24px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--sw-page-text);
  font-size: var(--sw-text-sm);
  font-weight: 700;
  letter-spacing: 0.04em;
}

input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--sw-input-border);
  border-radius: var(--sw-radius-md);
  outline: none;
  background: var(--sw-input-background);
  color: var(--sw-input-text);
  padding: 13px 14px;
  font: inherit;
  letter-spacing: normal;
  transition: border-color var(--sw-transition), background var(--sw-transition), box-shadow var(--sw-transition), transform var(--sw-transition);
}

input::placeholder,
textarea::placeholder { color: var(--sw-placeholder); }

input:focus,
select:focus,
textarea:focus {
  border-color: var(--sw-focus);
  background: var(--sw-input-background-focus);
  box-shadow: 0 0 0 4px var(--sw-focus-ring);
  transform: translateY(-1px);
}

textarea { resize: vertical; min-height: 150px; }
.wide { grid-column: 1 / -1; }

.form-footer {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

.form-footer small {
  color: var(--sw-page-text-muted);
  font-size: var(--sw-text-xs);
}

button {
  border: 0;
  border-radius: var(--sw-radius-pill);
  padding: 13px 20px;
  background: var(--sw-button-gradient);
  color: var(--sw-white);
  font: 700 var(--sw-text-sm) var(--sw-font-body);
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: var(--sw-button-shadow);
  transition: transform var(--sw-transition), box-shadow var(--sw-transition), opacity var(--sw-transition), filter var(--sw-transition);
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--sw-button-shadow-hover);
  filter: brightness(1.03);
}

button:disabled { opacity: 0.55; cursor: wait; }

.suggestion {
  padding: 20px 0 0;
  margin-top: 20px;
  border-top: 1px solid var(--sw-input-border);
}

.suggestion-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.suggestion-top strong {
  display: block;
  color: var(--sw-page-text);
  font-size: 1rem;
}

.suggestion-top span {
  display: block;
  margin-top: 5px;
  color: var(--sw-page-text-muted);
  font-size: var(--sw-text-xs);
}

.suggestion-top b {
  flex: 0 0 auto;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--sw-radius-pill);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.submitted { background: rgba(99, 102, 241, .10); color: #6366f1; }
.under-review { background: rgba(234, 140, 40, .12); color: #b86a13; }
.planned { background: rgba(200, 176, 25, .14); color: #7d6b00; }
.implemented { background: rgba(77, 147, 89, .13); color: #3f7a4a; }
.declined { background: rgba(190, 74, 74, .12); color: #a74444; }

.suggestion-message {
  margin: 13px 0 0;
  color: var(--sw-page-text-soft);
  line-height: 1.7;
  white-space: pre-wrap;
}

.response {
  margin-top: 14px;
  padding: 14px 16px;
  border-left: 3px solid var(--sw-gold-500);
  border-radius: 0 var(--sw-radius-md) var(--sw-radius-md) 0;
  background: var(--sw-page-surface-soft);
}

.response span {
  color: var(--sw-page-text-muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.response p {
  margin: 7px 0 0;
  color: var(--sw-page-text);
  line-height: 1.65;
  white-space: pre-wrap;
}

html.dark-mode .glass-panel {
  border-color: var(--sw-glass-dark-border);
  background: var(--sw-glass-dark);
  box-shadow: var(--sw-glass-shadow-dark);
}

html.dark-mode .hero-badge { color: var(--sw-gold-500); }

html.dark-mode .response { background: rgba(255, 255, 255, 0.045); }
html.dark-mode .under-review { color: #eaa75b; }
html.dark-mode .planned { color: #e3cf57; }
html.dark-mode .implemented { color: #79c484; }
html.dark-mode .declined { color: #ef8d8d; }

@media (max-width: 700px) {
  .hero { display: block; }
  .hero-badge { display: inline-block; margin-top: 20px; }
  form { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
  .form-footer { align-items: flex-start; flex-direction: column-reverse; }
  .form-footer button { width: 100%; }
  .suggestion-top { display: block; }
  .suggestion-top b { display: inline-block; margin-top: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .suggestions-page *,
  .notice-enter-active,
  .notice-leave-active { transition: none !important; }
}
</style>
