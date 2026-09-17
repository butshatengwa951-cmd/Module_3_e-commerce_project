<template>
  <main class="admin-suggestions-page">
    <section class="admin-suggestions-container">
      <header class="admin-heading">
        <div>
          <p class="eyebrow">STOCKWELL ADMIN</p>
          <h1>Member suggestions</h1>
          <p class="intro">Review feedback from members, track its progress and send a response.</p>
        </div>
        <RouterLink class="secondary-button" to="/admin">Back to dashboard</RouterLink>
      </header>

      <div v-if="notice" class="message success-message" role="status" aria-live="polite">{{ notice }}</div>

      <section class="toolbar-card">
        <label><span>Search</span><input v-model="search" placeholder="Suggestions, members or categories…" /></label>
        <label><span>Status</span><select v-model="filter"><option value="All">All statuses</option><option v-for="status in statuses" :key="status">{{ status }}</option></select></label>
      </section>

      <section class="list">
        <article v-for="item in filtered" :key="item.suggestion_id" class="suggestion-card">
          <header class="suggestion-header">
            <div><p class="eyebrow">#{{ item.suggestion_id }} · {{ item.category }}</p><h2>{{ item.subject }}</h2><small>{{ item.user_name }} · {{ item.user_email }} · {{ formatDate(item.created_at) }}</small></div>
            <span :class="['status', statusClass(item.status)]">{{ item.status }}</span>
          </header>
          <div class="suggestion-body"><span>MEMBER SUGGESTION</span><p>{{ item.message }}</p></div>
          <div class="admin-controls">
            <label><span>Update status</span><select v-model="item.status"><option v-for="status in statuses" :key="status">{{ status }}</option></select></label>
            <label><span>Response to member</span><textarea v-model="item.admin_response" rows="4" placeholder="Write an optional response to the member…"></textarea></label>
            <button class="primary-button" :disabled="saving === item.suggestion_id" type="button" @click="save(item)">{{ saving === item.suggestion_id ? 'Saving…' : 'Save update' }}</button>
          </div>
        </article>
        <div v-if="!filtered.length" class="empty-card"><p class="eyebrow">NO RESULTS</p><h2>No suggestions match your filters.</h2><p>Try another search term or select a different status.</p></div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
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
  return suggestions.value.filter((s) => (filter.value === "All" || s.status === filter.value) && (!q || `${s.subject} ${s.message} ${s.user_name} ${s.user_email} ${s.category}`.toLowerCase().includes(q)));
});

const notify = (text) => { notice.value = text; window.setTimeout(() => { notice.value = ""; }, 3500); };
async function load() { try { const r = await getAllSuggestions(); suggestions.value = r.suggestions || []; } catch (e) { notify(e.response?.data?.message || "Unable to load suggestions."); } }
async function save(item) { saving.value = item.suggestion_id; try { const r = await updateSuggestion(item.suggestion_id, item.status, item.admin_response || ""); Object.assign(item, r.suggestion); notify("Suggestion updated successfully."); } catch (e) { notify(e.response?.data?.message || "Unable to update suggestion."); } finally { saving.value = null; } }
function formatDate(value) { return value ? new Date(value).toLocaleString() : "—"; }
function statusClass(status) { return status.toLowerCase().replace(/\s+/g, "-"); }
function refreshWhenVisible() { if (document.visibilityState === "visible") load(); }
onMounted(() => { load(); refreshTimer = window.setInterval(load, 15000); document.addEventListener("visibilitychange", refreshWhenVisible); });
onBeforeUnmount(() => { if (refreshTimer) window.clearInterval(refreshTimer); document.removeEventListener("visibilitychange", refreshWhenVisible); });
</script>

<style scoped>
.admin-suggestions-page{min-height:calc(100vh - 68px);padding:36px 24px 60px;background:var(--sw-bg,#f7f5ef);color:var(--sw-text,#17211b)}.admin-suggestions-container{max-width:1180px;margin:0 auto}.admin-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:28px}.eyebrow{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--sw-primary,#5b3a82)}h1{margin:0;font-size:42px;line-height:1.08;color:var(--sw-text,#17211b)}.intro{max-width:760px;margin:12px 0 0;color:var(--sw-muted,#68736d);line-height:1.7}.secondary-button{padding:13px 20px;border-radius:999px;border:1px solid var(--sw-border,#d9ddd8);background:transparent;color:var(--sw-text,#17211b);font-weight:800;text-decoration:none;white-space:nowrap}.message{padding:14px 16px;border-radius:14px;margin-bottom:20px}.success-message{background:rgba(94,160,111,.1);border:1px solid rgba(94,160,111,.22);color:var(--sw-text,#17211b)}.toolbar-card,.suggestion-card,.empty-card{border:1px solid var(--sw-border,#d9ddd8);background:var(--sw-surface,#fff);border-radius:24px;box-shadow:var(--sw-card-shadow,0 10px 30px rgba(0,0,0,.06))}.toolbar-card{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:16px;padding:20px 22px;margin-bottom:20px}.toolbar-card label,.admin-controls label{display:grid;gap:8px;color:var(--sw-text,#17211b);font-size:12px;font-weight:800}.toolbar-card input,.toolbar-card select,.admin-controls select,.admin-controls textarea{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid var(--sw-border,#d9ddd8);border-radius:14px;background:var(--sw-surface,#fff);color:var(--sw-text,#17211b);font:inherit;outline:none}.toolbar-card input::placeholder,.admin-controls textarea::placeholder{color:var(--sw-muted,#68736d)}.toolbar-card input:focus,.toolbar-card select:focus,.admin-controls select:focus,.admin-controls textarea:focus{border-color:var(--sw-primary,#5b3a82);box-shadow:0 0 0 3px rgba(91,58,130,.12)}.list{display:grid;gap:18px}.suggestion-card{overflow:hidden}.suggestion-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:24px 26px;border-bottom:1px solid var(--sw-border,#d9ddd8)}.suggestion-header h2{margin:0 0 6px;color:var(--sw-text,#17211b)}.suggestion-header small{color:var(--sw-muted,#68736d);font-size:12px}.status{flex:0 0 auto;padding:7px 11px;border-radius:999px;font-size:10px;font-weight:800}.submitted{background:#eef2ff;color:#4f46e5}.under-review{background:#fff3e6;color:#aa6417}.planned{background:#fff8cf;color:#7d6b00}.implemented{background:#e8f6e9;color:#3f7a4a}.declined{background:#fdeaea;color:#a74444}.suggestion-body{padding:20px 26px;color:var(--sw-text,#17211b);line-height:1.7}.suggestion-body>span{color:var(--sw-muted,#68736d);font-size:9px;font-weight:800;letter-spacing:.15em}.suggestion-body p{margin:8px 0 0;white-space:pre-wrap}.admin-controls{display:grid;grid-template-columns:190px minmax(0,1fr) auto;gap:14px;align-items:end;padding:20px 26px;background:var(--sw-accent-soft,#f2f0f5);border-top:1px solid var(--sw-border,#d9ddd8)}.admin-controls textarea{resize:vertical;min-height:72px}.primary-button{border:0;border-radius:999px;padding:13px 20px;background:var(--sw-primary,#5b3a82);color:#fff;font-weight:800;cursor:pointer;white-space:nowrap}.primary-button:disabled{opacity:.5;cursor:not-allowed}.empty-card{text-align:center;padding:50px 25px;color:var(--sw-muted,#68736d)}.empty-card h2{margin:8px 0;color:var(--sw-text,#17211b)}.empty-card p:last-child{margin:0}@media(max-width:800px){.admin-heading{flex-direction:column}.toolbar-card{grid-template-columns:1fr}.admin-controls{grid-template-columns:1fr}.primary-button{width:100%}}@media(max-width:600px){.admin-suggestions-page{padding:30px 18px 48px}h1{font-size:34px}.suggestion-header{display:block;padding:20px}.suggestion-body{padding:20px}.admin-controls{padding:20px}.status{display:inline-block;margin-top:12px}}
</style>
