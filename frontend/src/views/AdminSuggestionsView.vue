<template>
  <main class="admin-suggestions">
    <header class="hero"><div><span class="eyebrow">STOCKWELL ADMIN</span><h1>Member suggestions</h1><p>Review feedback from members, track its progress and send a response.</p></div><router-link to="/admin">Back to dashboard</router-link></header>
    <div v-if="notice" class="notice">{{ notice }}</div>
    <section class="toolbar"><input v-model="search" placeholder="Search suggestions, members or categories…" /><select v-model="filter"><option value="All">All statuses</option><option v-for="status in statuses" :key="status">{{ status }}</option></select></section>
    <section class="list">
      <article v-for="item in filtered" :key="item.suggestion_id" class="card">
        <header><div><span class="eyebrow">#{{ item.suggestion_id }} · {{ item.category }}</span><h2>{{ item.subject }}</h2><small>{{ item.user_name }} · {{ item.user_email }} · {{ formatDate(item.created_at) }}</small></div><span class="status">{{ item.status }}</span></header>
        <p class="body">{{ item.message }}</p>
        <div class="controls"><select v-model="item.status"><option v-for="status in statuses" :key="status">{{ status }}</option></select><textarea v-model="item.admin_response" rows="3" placeholder="Optional response to the member…"></textarea><button :disabled="saving === item.suggestion_id" @click="save(item)">{{ saving === item.suggestion_id ? 'Saving…' : 'Save response' }}</button></div>
      </article>
      <div v-if="!filtered.length" class="empty">No suggestions match your filters.</div>
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
  return suggestions.value.filter(s =>
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
    notify("Suggestion updated.");
  } catch (e) {
    notify(e.response?.data?.message || "Unable to update suggestion.");
  } finally {
    saving.value = null;
  }
}

function formatDate(value) { return value ? new Date(value).toLocaleString() : "—"; }
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
.admin-suggestions{min-height:100vh;padding:45px clamp(18px,5vw,70px);background:var(--sw-page-gradient,#f7f8fc);color:var(--sw-page-text,#18202b)}.hero,.toolbar,.list{max-width:1100px;margin:0 auto}.hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:28px}.hero h1{font-size:clamp(2.2rem,5vw,4rem);margin:8px 0}.hero p{opacity:.7}.hero a{padding:10px 15px;border:1px solid #d7dce5;border-radius:10px;text-decoration:none;color:inherit;background:#fff}.eyebrow{font-size:.68rem;letter-spacing:.15em;font-weight:800;opacity:.6}.notice{max-width:1100px;margin:0 auto 18px;padding:12px 15px;border-radius:12px;background:#e7f5ec}.toolbar{display:grid;grid-template-columns:1fr 220px;gap:12px;margin-bottom:18px}.toolbar input,.toolbar select,.controls select,.controls textarea{border:1px solid #d7dce5;border-radius:10px;padding:11px;background:#fff;color:inherit;font:inherit}.list{display:grid;gap:16px}.card{padding:23px;border:1px solid rgba(0,0,0,.08);border-radius:20px;background:rgba(255,255,255,.8);box-shadow:0 8px 28px rgba(0,0,0,.05)}.card header{display:flex;justify-content:space-between;gap:20px}.card h2{margin:6px 0}.card small{opacity:.62}.status{white-space:nowrap;height:max-content;padding:6px 10px;border-radius:999px;background:#eef2ff;font-size:.72rem;font-weight:700}.body{line-height:1.7;opacity:.82}.controls{display:grid;grid-template-columns:180px 1fr auto;gap:10px;align-items:start}.controls button{border:0;border-radius:10px;padding:11px 15px;background:#111827;color:#fff;cursor:pointer}.controls button:disabled{opacity:.5}.empty{text-align:center;padding:45px;opacity:.6}@media(max-width:700px){.hero{display:block}.hero a{display:inline-block;margin-top:12px}.toolbar,.controls{grid-template-columns:1fr}.card header{display:block}.status{display:inline-block;margin-top:10px}}
</style>
