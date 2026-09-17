<template>
  <main class="suggestions-page">
    <section class="hero">
      <span class="eyebrow">MEMBER VOICE</span>
      <h1>Help us improve StockWell.</h1>
      <p>Send an idea, report a recurring problem, or suggest something that would make your Stokvel experience better.</p>
    </section>

    <div v-if="message" class="notice">{{ message }}</div>

    <section class="card">
      <div class="heading"><span class="eyebrow">NEW SUGGESTION</span><h2>Share your idea</h2></div>
      <form @submit.prevent="submit">
        <label>Subject<input v-model="form.subject" maxlength="150" required placeholder="What would you like us to improve?" /></label>
        <label>Category<select v-model="form.category"><option v-for="category in categories" :key="category">{{ category }}</option></select></label>
        <label class="wide">Suggestion<textarea v-model="form.message" maxlength="2000" rows="7" required placeholder="Tell us what you would change and why..."></textarea></label>
        <button :disabled="submitting">{{ submitting ? 'Submitting…' : 'Submit suggestion' }}</button>
      </form>
    </section>

    <section class="card" v-if="suggestions.length">
      <div class="heading"><span class="eyebrow">MY SUBMISSIONS</span><h2>Suggestion history</h2></div>
      <article v-for="item in suggestions" :key="item.suggestion_id" class="suggestion">
        <div><strong>{{ item.subject }}</strong><span>{{ item.category }} · {{ formatDate(item.created_at) }}</span></div>
        <b :class="statusClass(item.status)">{{ item.status }}</b>
        <p>{{ item.message }}</p>
        <div v-if="item.admin_response" class="response"><strong>StockWell response</strong><p>{{ item.admin_response }}</p></div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { createSuggestion, getMySuggestions } from "../services/api.js";

const categories = ["General", "Products", "Orders", "Delivery", "Stokvel", "Website"];
const form = reactive({ subject: "", category: "General", message: "" });
const suggestions = ref([]); const message = ref(""); const submitting = ref(false);
const notify = (text) => { message.value = text; window.setTimeout(() => { message.value = ""; }, 3500); };
async function load() { try { const r = await getMySuggestions(); suggestions.value = r.suggestions || []; } catch (e) { notify(e.response?.data?.message || "Unable to load suggestions."); } }
async function submit() { submitting.value = true; try { const r = await createSuggestion(form); suggestions.value.unshift(r.suggestion); form.subject = ""; form.category = "General"; form.message = ""; notify("Suggestion submitted. Thank you for helping improve StockWell."); } catch (e) { notify(e.response?.data?.message || "Unable to submit suggestion."); } finally { submitting.value = false; } }
function formatDate(value) { return value ? new Date(value).toLocaleDateString() : "—"; }
function statusClass(status) { return status.toLowerCase().replace(/\s+/g, "-"); }
onMounted(load);
</script>

<style scoped>
.suggestions-page{min-height:100vh;padding:48px clamp(18px,5vw,72px);background:var(--sw-page-gradient,#f7f8fc);color:var(--sw-page-text,#18202b)}.hero,.card{max-width:1000px;margin:0 auto}.hero{padding:25px 0 30px}.eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.16em;opacity:.62}.hero h1{font-size:clamp(2.2rem,5vw,4rem);margin:10px 0}.hero p{max-width:720px;opacity:.72;line-height:1.7}.card{margin-bottom:24px;padding:26px;border:1px solid rgba(0,0,0,.08);border-radius:22px;background:rgba(255,255,255,.78);box-shadow:0 10px 35px rgba(0,0,0,.05)}.heading{margin-bottom:20px}.heading h2{margin:6px 0 0}form{display:grid;grid-template-columns:1fr 1fr;gap:16px}label{display:grid;gap:7px;font-size:.78rem;font-weight:700}input,select,textarea{font:inherit;border:1px solid #d7dce5;border-radius:11px;padding:12px;background:#fff;color:inherit}textarea{resize:vertical}.wide{grid-column:1/-1}button{grid-column:1/-1;justify-self:start;border:0;border-radius:12px;padding:12px 20px;background:#111827;color:#fff;cursor:pointer;font-weight:700}button:disabled{opacity:.55;cursor:wait}.notice{max-width:1000px;margin:0 auto 18px;padding:12px 16px;border-radius:12px;background:#e7f5ec}.suggestion{padding:17px 0;border-top:1px solid rgba(0,0,0,.08)}.suggestion>div:first-child{display:flex;justify-content:space-between;gap:15px}.suggestion span{display:block;font-size:.8rem;opacity:.6;margin-top:4px}.suggestion b{display:inline-block;margin:10px 0;padding:5px 9px;border-radius:999px;font-size:.7rem}.submitted{background:#eef2ff}.under-review{background:#fff7ed}.planned{background:#fef3c7}.implemented{background:#dcfce7}.declined{background:#fee2e2}.suggestion p{line-height:1.6;opacity:.78}.response{padding:12px 15px;border-radius:12px;background:rgba(0,0,0,.035)}@media(max-width:650px){form{grid-template-columns:1fr}.wide{grid-column:auto}.suggestion>div:first-child{display:block}}
</style>
