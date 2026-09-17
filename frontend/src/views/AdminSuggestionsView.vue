<template>
  <main class="admin-suggestions">
    <header class="hero glass-panel">
      <div>
        <span class="eyebrow">STOCKWELL ADMIN</span>
        <h1>Member suggestions</h1>
        <p>Review member feedback, track its progress and send a response directly from the admin workspace.</p>
      </div>
      <router-link class="back-link" to="/admin">Back to dashboard</router-link>
    </header>

    <Transition name="notice">
      <div v-if="notice" class="notice" role="status" aria-live="polite">{{ notice }}</div>
    </Transition>

    <section class="toolbar glass-panel">
      <label class="search-field">
        <span>Search</span>
        <input v-model="search" placeholder="Suggestions, members or categories…" />
      </label>
      <label>
        <span>Status</span>
        <select v-model="filter">
          <option value="All">All statuses</option>
          <option v-for="status in statuses" :key="status">{{ status }}</option>
        </select>
      </label>
    </section>

    <section class="list">
      <article v-for="item in filtered" :key="item.suggestion_id" class="card glass-panel">
        <header>
          <div class="title-block">
            <div class="meta-row">
              <span class="eyebrow">#{{ item.suggestion_id }}</span>
              <span class="category">{{ item.category }}</span>
            </div>
            <h2>{{ item.subject }}</h2>
            <small>{{ item.user_name }} · {{ item.user_email }} · {{ formatDate(item.created_at) }}</small>
          </div>
          <span :class="['status', statusClass(item.status)]">{{ item.status }}</span>
        </header>

        <div class="message-box">
          <span>MEMBER SUGGESTION</span>
          <p>{{ item.message }}</p>
        </div>

        <div class="controls">
          <label>
            <span>Update status</span>
            <select v-model="item.status">
              <option v-for="status in statuses" :key="status">{{ status }}</option>
            </select>
          </label>

          <label>
            <span>Response to member</span>
            <textarea v-model="item.admin_response" rows="4" placeholder="Write an optional response to the member…"></textarea>
          </label>

          <button :disabled="saving === item.suggestion_id" @click="save(item)">
            {{ saving === item.suggestion_id ? 'Saving…' : 'Save update' }}
          </button>
        </div>
      </article>

      <div v-if="!filtered.length" class="empty glass-panel">
        <span class="eyebrow">NO RESULTS</span>
        <h2>No suggestions match your filters.</h2>
        <p>Try another search term or select a different status.</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { getAllSuggestions, updateSuggestion } from "../services/api.js";

const statuses = ["Submitted", "Under Review", "Planned", "Implemented", "Declined"];
const suggestions = ref([]);
const search = ref("");
const filter = ref("All");
const notice = ref("");
const saving = ref(null);
let refreshTimer = null;

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  return suggestions.value.filter((s) =>
    (filter.value === "All" || s.status === filter.value) &&
    (!q || `${s.subject} ${s.message} ${s.user_name} ${s.user_email} ${s.category}`.toLowerCase().includes(q))
  );
});

const notify = (text) => {
  notice.value = text;
  window.setTimeout(() => { notice.value = ""; }, 3500);
};

async function load() {
  try {
    const r = await getAllSuggestions();
    suggestions.value = r.suggestions || [];
  } catch (e) {
    notify(e.response?.data?.message || "Unable to load suggestions.");
  }
}

async function save(item) {
  saving.value = item.suggestion_id;
  try {
    const r = await updateSuggestion(item.suggestion_id, item.status, item.admin_response || "");
    Object.assign(item, r.suggestion);
    notify("Suggestion updated successfully.");
  } catch (e) {
    notify(e.response?.data?.message || "Unable to update suggestion.");
  } finally {
    saving.value = null;
  }
}

function formatDate(value) { return value ? new Date(value).toLocaleString() : "—"; }
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
.admin-suggestions {
  min-height: calc(100vh - 68px);
  padding: clamp(28px, 5vw, 58px) clamp(18px, 5vw, 72px) 70px;
  background:
    radial-gradient(circle at 10% 0%, rgba(126, 92, 154, 0.10), transparent 30%),
    radial-gradient(circle at 90% 8%, rgba(208, 185, 91, 0.08), transparent 28%),
    var(--sw-page-gradient);
  color: var(--sw-page-text);
  font-family: var(--sw-font-body);
}

.glass-panel {
  border: 1px solid var(--sw-glass-light-border);
  background: var(--sw-glass-light);
  box-shadow: var(--sw-glass-shadow-light);
  backdrop-filter: blur(var(--sw-glass-blur)) saturate(var(--sw-glass-saturation));
  -webkit-backdrop-filter: blur(var(--sw-glass-blur)) saturate(var(--sw-glass-saturation));
}

.hero,
.toolbar,
.list,
.notice {
  width: min(1100px, 100%);
  margin-inline: auto;
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
  color: var(--sw-page-text-muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.17em;
}

.hero h1 {
  margin: 8px 0 0;
  color: var(--sw-page-text);
  font-size: clamp(2.2rem, 5vw, 4rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.hero p {
  max-width: 720px;
  margin: 15px 0 0;
  color: var(--sw-page-text-soft);
  line-height: 1.7;
}

.back-link {
  flex: 0 0 auto;
  padding: 11px 16px;
  border: 1px solid var(--sw-input-border);
  border-radius: var(--sw-radius-pill);
  background: var(--sw-input-background);
  color: var(--sw-page-text);
  font-size: var(--sw-text-sm);
  font-weight: 700;
  text-decoration: none;
  transition: transform var(--sw-transition), background var(--sw-transition), border-color var(--sw-transition);
}

.back-link:hover { transform: translateY(-2px); background: var(--sw-input-background-focus); border-color: var(--sw-focus); }

.notice {
  margin-top: 18px;
  padding: 13px 16px;
  border: 1px solid rgba(74, 128, 91, 0.28);
  border-radius: var(--sw-radius-md);
  background: rgba(94, 160, 111, 0.12);
  color: var(--sw-page-text);
}

.notice-enter-active,
.notice-leave-active { transition: opacity .25s ease, transform .25s ease; }
.notice-enter-from,
.notice-leave-to { opacity: 0; transform: translateY(-8px); }

.toolbar {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
  margin-top: 22px;
  padding: 18px;
  border-radius: var(--sw-radius-lg);
}

.toolbar label,
.controls label {
  display: grid;
  gap: 7px;
  color: var(--sw-page-text);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .10em;
  text-transform: uppercase;
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
  padding: 12px 13px;
  font: normal var(--sw-text-sm) var(--sw-font-body);
  letter-spacing: normal;
  text-transform: none;
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

.list { display: grid; gap: 18px; margin-top: 22px; }

.card {
  padding: clamp(21px, 3vw, 30px);
  border-radius: var(--sw-radius-xl);
}

.card > header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.meta-row { display: flex; align-items: center; gap: 10px; }
.category { color: var(--sw-page-text-muted); font-size: 9px; font-weight: 700; letter-spacing: .10em; text-transform: uppercase; }
.card h2 { margin: 7px 0 5px; color: var(--sw-page-text); font-size: clamp(1.2rem, 2.5vw, 1.65rem); letter-spacing: -.03em; }
.card small { color: var(--sw-page-text-muted); font-size: var(--sw-text-xs); }

.status {
  flex: 0 0 auto;
  padding: 7px 11px;
  border: 1px solid transparent;
  border-radius: var(--sw-radius-pill);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .07em;
}

.status.submitted { background: rgba(99,102,241,.10); color: #6366f1; }
.status.under-review { background: rgba(234,140,40,.12); color: #b86a13; }
.status.planned { background: rgba(200,176,25,.14); color: #7d6b00; }
.status.implemented { background: rgba(77,147,89,.13); color: #3f7a4a; }
.status.declined { background: rgba(190,74,74,.12); color: #a74444; }

.message-box {
  margin-top: 20px;
  padding: 15px 17px;
  border: 1px solid var(--sw-input-border);
  border-radius: var(--sw-radius-md);
  background: var(--sw-page-surface-soft);
}

.message-box span { color: var(--sw-page-text-muted); font-size: 9px; font-weight: 800; letter-spacing: .15em; }
.message-box p { margin: 8px 0 0; color: var(--sw-page-text-soft); line-height: 1.7; white-space: pre-wrap; }

.controls {
  display: grid;
  grid-template-columns: 190px 1fr auto;
  gap: 12px;
  align-items: end;
  margin-top: 18px;
}

.controls textarea { resize: vertical; min-height: 92px; }
.controls button {
  border: 0;
  border-radius: var(--sw-radius-pill);
  padding: 13px 19px;
  background: var(--sw-button-gradient);
  color: var(--sw-white);
  font: 700 var(--sw-text-sm) var(--sw-font-body);
  cursor: pointer;
  box-shadow: var(--sw-button-shadow);
  transition: transform var(--sw-transition), box-shadow var(--sw-transition), opacity var(--sw-transition);
}

.controls button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--sw-button-shadow-hover); }
.controls button:disabled { opacity: .55; cursor: wait; }

.empty { padding: 45px 25px; border-radius: var(--sw-radius-xl); text-align: center; }
.empty h2 { margin: 8px 0 0; color: var(--sw-page-text); }
.empty p { margin: 8px 0 0; color: var(--sw-page-text-soft); }

html.dark-mode .glass-panel { border-color: var(--sw-glass-dark-border); background: var(--sw-glass-dark); box-shadow: var(--sw-glass-shadow-dark); }
html.dark-mode .message-box { background: rgba(255,255,255,.045); }
html.dark-mode .status.under-review { color: #eaa75b; }
html.dark-mode .status.planned { color: #e3cf57; }
html.dark-mode .status.implemented { color: #79c484; }
html.dark-mode .status.declined { color: #ef8d8d; }

@media (max-width: 760px) {
  .hero { display: block; }
  .back-link { display: inline-block; margin-top: 18px; }
  .toolbar, .controls { grid-template-columns: 1fr; }
  .card > header { display: block; }
  .status { display: inline-block; margin-top: 12px; }
  .controls button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .admin-suggestions *, .notice-enter-active, .notice-leave-active { transition: none !important; }
}
</style>
