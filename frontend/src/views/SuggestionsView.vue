<template>
  <main class="suggestions-page">
    <section class="suggestions-container">
      <div class="suggestions-heading">
        <div>
          <p class="eyebrow">MEMBER FEEDBACK</p>
          <h1>Help us improve StockWell.</h1>
          <p class="intro">Send an idea, report a recurring problem, or suggest something that would make your Stokvel experience better.</p>
        </div>
      </div>

      <div v-if="message" class="message success-message" role="status" aria-live="polite">{{ message }}</div>

      <section class="suggestion-card">
        <div class="card-header">
          <div>
            <p class="eyebrow">NEW SUGGESTION</p>
            <h2>Share your idea</h2>
            <p>Every suggestion is sent to the StockWell admin team for review.</p>
          </div>
        </div>

        <form @submit.prevent="submit">
          <label>
            Subject
            <input v-model="form.subject" maxlength="150" required placeholder="What would you like us to improve?" />
          </label>
          <label>
            Category
            <select v-model="form.category">
              <option v-for="category in categories" :key="category">{{ category }}</option>
            </select>
          </label>
          <label class="wide">
            Suggestion
            <textarea v-model="form.message" maxlength="2000" rows="7" required placeholder="Tell us what you would change and why..."></textarea>
          </label>
          <div class="form-footer">
            <small>{{ form.message.length }}/2000</small>
            <button class="primary-button" :disabled="submitting" type="submit">{{ submitting ? 'Submitting…' : 'Submit suggestion' }}</button>
          </div>
        </form>
      </section>

      <section class="suggestion-card" v-if="suggestions.length">
        <div class="card-header">
          <div>
            <p class="eyebrow">MY SUBMISSIONS</p>
            <h2>Suggestion history</h2>
            <p>Track replies and status updates from the admin team.</p>
          </div>
        </div>

        <article v-for="item in suggestions" :key="item.suggestion_id" class="suggestion-item">
          <div class="suggestion-top">
            <div>
              <h3>{{ item.subject }}</h3>
              <p>{{ item.category }} · {{ formatDate(item.created_at) }}</p>
            </div>
            <b :class="statusClass(item.status)">{{ item.status }}</b>
          </div>
          <p class="suggestion-message">{{ item.message }}</p>
          <div v-if="item.admin_response" class="response-box">
            <strong>StockWell response</strong>
            <p>{{ item.admin_response }}</p>
          </div>
        </article>
      </section>
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
.suggestions-page{min-height:calc(100vh - 68px);padding:36px 24px 60px;background:var(--sw-bg,#f7f5ef);color:var(--sw-text,#17211b)}.suggestions-container{max-width:1180px;margin:0 auto}.suggestions-heading{margin-bottom:28px}.eyebrow{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--sw-primary,#5b3a82)}h1{margin:0;font-size:42px;line-height:1.08;color:var(--sw-text,#17211b)}.intro{max-width:760px;margin:12px 0 0;color:var(--sw-muted,#68736d);line-height:1.7}.message{padding:14px 16px;border-radius:14px;margin-bottom:20px}.success-message{background:rgba(94,160,111,.1);border:1px solid rgba(94,160,111,.22);color:var(--sw-text,#17211b)}.suggestion-card{margin-bottom:24px;border:1px solid var(--sw-border,#d9ddd8);background:var(--sw-surface,#fff);border-radius:24px;box-shadow:var(--sw-card-shadow,0 10px 30px rgba(0,0,0,.06))}.card-header{padding:24px 26px;border-bottom:1px solid var(--sw-border,#d9ddd8)}.card-header h2{margin:0 0 5px;color:var(--sw-text,#17211b)}.card-header p:not(.eyebrow){margin:0;color:var(--sw-muted,#68736d);line-height:1.6;font-size:13px}form{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:24px 26px}label{display:grid;gap:8px;color:var(--sw-text,#17211b);font-size:13px;font-weight:700}input,select,textarea{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid var(--sw-border,#d9ddd8);border-radius:14px;background:var(--sw-surface,#fff);color:var(--sw-text,#17211b);font:inherit;outline:none}input::placeholder,textarea::placeholder{color:var(--sw-muted,#68736d)}input:focus,select:focus,textarea:focus{border-color:var(--sw-primary,#5b3a82);box-shadow:0 0 0 3px rgba(91,58,130,.12)}textarea{resize:vertical;min-height:150px}.wide{grid-column:1/-1}.form-footer{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;gap:18px}.form-footer small{color:var(--sw-muted,#68736d);font-size:12px}.primary-button{border:0;border-radius:999px;padding:13px 22px;background:var(--sw-primary,#5b3a82);color:#fff;font-weight:800;cursor:pointer}.primary-button:disabled{opacity:.5;cursor:not-allowed}.suggestion-item{padding:22px 26px;border-bottom:1px solid var(--sw-border,#d9ddd8)}.suggestion-item:last-child{border-bottom:0}.suggestion-top{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.suggestion-top h3{margin:0;color:var(--sw-text,#17211b)}.suggestion-top p{margin:5px 0 0;color:var(--sw-muted,#68736d);font-size:12px}.suggestion-top b{flex:0 0 auto;padding:6px 10px;border-radius:999px;font-size:10px;letter-spacing:.03em}.submitted{background:#eef2ff;color:#4f46e5}.under-review{background:#fff3e6;color:#aa6417}.planned{background:#fff8cf;color:#7d6b00}.implemented{background:#e8f6e9;color:#3f7a4a}.declined{background:#fdeaea;color:#a74444}.suggestion-message{margin:15px 0 0;color:var(--sw-text,#17211b);line-height:1.7;white-space:pre-wrap}.response-box{margin-top:14px;padding:14px 16px;border-radius:14px;background:var(--sw-accent-soft,#f2f0f5);border-left:3px solid var(--sw-primary,#5b3a82)}.response-box strong{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--sw-primary,#5b3a82)}.response-box p{margin:6px 0 0;color:var(--sw-text,#17211b);line-height:1.6;white-space:pre-wrap}@media(max-width:700px){.suggestions-page{padding:30px 18px 48px}h1{font-size:34px}form{grid-template-columns:1fr;padding:20px}.wide{grid-column:auto}.form-footer{align-items:flex-start;flex-direction:column-reverse}.form-footer button{width:100%}.card-header{padding:20px}.suggestion-item{padding:20px}.suggestion-top{display:block}.suggestion-top b{display:inline-block;margin-top:12px}}
</style>
