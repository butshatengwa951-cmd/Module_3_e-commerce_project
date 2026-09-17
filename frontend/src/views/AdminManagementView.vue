<template>
  <main class="management-page">
    <section class="container">
      <header class="page-head">
        <div><p class="eyebrow">STOCKWELL ADMIN</p><h1>Administration</h1><p>Manage company accounts, assign Stokvel officers, inspect performance, and review administrator activity.</p></div>
        <router-link class="back" to="/admin">Back to dashboard</router-link>
      </header>

      <div v-if="message" class="notice">{{ message }}</div>

      <nav class="tabs">
        <button v-for="tab in tabs" :key="tab" :class="{active: activeTab === tab}" @click="activeTab=tab">{{ tab }}</button>
      </nav>

      <section v-if="activeTab === 'Users'" class="panel">
        <div class="panel-head"><div><p class="eyebrow">USER MANAGEMENT</p><h2>Accounts & company roles</h2><p>Admin is a company-level role. Chairperson and Treasurer are assigned inside a specific Stokvel.</p></div><input v-model="userSearch" placeholder="Search name, email or Stokvel…" /></div>
        <div class="table-wrap"><table><thead><tr><th>User</th><th>Contact</th><th>Stokvel</th><th>Company role</th><th>Joined</th><th>Action</th></tr></thead><tbody>
          <tr v-for="user in filteredUsers" :key="user.user_id"><td><strong>{{ user.full_name }}</strong><small>#{{ user.user_id }}</small></td><td>{{ user.email }}<small>{{ user.phone_number || 'No phone' }}</small></td><td>{{ user.stokvels || '—' }}</td><td><select v-model="user.role"><option value="member">Member</option><option value="admin">Admin</option></select></td><td>{{ formatDate(user.created_at) }}</td><td><button @click="saveRole(user)">Save</button></td></tr>
          <tr v-if="!filteredUsers.length"><td colspan="6" class="empty">No matching users.</td></tr>
        </tbody></table></div>
      </section>

      <section v-if="activeTab === 'Stokvels'" class="panel">
        <div class="panel-head"><div><p class="eyebrow">STOKVEL MANAGEMENT</p><h2>Groups, members & officers</h2><p>Membership is one Stokvel per account. Assign at most one Chairperson and one Treasurer to each group.</p></div></div>
        <div class="stokvel-grid"><article v-for="group in stokvels" :key="group.stokvel_id" :class="['stokvel-card',{selected:selectedStokvel?.stokvel_id===group.stokvel_id}]" @click="selectStokvel(group)"><strong>{{ group.stokvel_name }}</strong><span>{{ group.member_count }} members</span><small>Chairperson: {{ group.chairperson_name || '—' }}</small></article></div>
        <div v-if="selectedStokvel" class="member-area">
          <div class="member-head"><div><p class="eyebrow">{{ selectedStokvel.stokvel_name }}</p><h3>Members & roles</h3></div><div class="add-member"><select v-model.number="newMemberId"><option :value="null" disabled>Add a user…</option><option v-for="user in availableMembers" :key="user.user_id" :value="user.user_id">{{ user.full_name }} · {{ user.email }}</option></select><button @click="addMember">Add member</button></div></div>
          <div class="member-list">
            <article v-for="member in members" :key="member.user_id">
              <div><strong>{{ member.full_name }}</strong><span>{{ member.email }} · company: {{ member.company_role }}</span></div>
              <div class="member-actions"><select :value="member.stokvel_role" @change="saveStokvelRole(member, $event.target.value)"><option value="MEMBER">Member</option><option value="CHAIRPERSON">Chairperson</option><option value="TREASURER">Treasurer</option></select><button class="danger" @click="removeMember(member)">Remove</button></div>
            </article>
            <p v-if="!members.length" class="empty">No members found.</p>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'Analytics'" class="panel">
        <div class="panel-head"><div><p class="eyebrow">REPORTING</p><h2>Business analytics</h2><p>Revenue is counted from completed orders only.</p></div><button @click="loadAnalytics">Refresh</button></div>
        <div class="metric-grid"><article><span>Total orders</span><strong>{{ analytics.summary?.total_orders || 0 }}</strong></article><article><span>Completed revenue</span><strong>R {{ money(analytics.summary?.revenue) }}</strong></article><article><span>Average completed order</span><strong>R {{ money(analytics.summary?.average_order_value) }}</strong></article><article><span>Completed</span><strong>{{ analytics.summary?.completed_orders || 0 }}</strong></article><article><span>Cancelled</span><strong>{{ analytics.summary?.cancelled_orders || 0 }}</strong></article></div>
        <div class="analytics-grid"><div><h3>Monthly completed revenue</h3><div class="table-wrap"><table><thead><tr><th>Month</th><th>Orders</th><th>Revenue</th></tr></thead><tbody><tr v-for="row in analytics.monthlyRevenue" :key="row.month"><td>{{ row.month }}</td><td>{{ row.orders }}</td><td>R {{ money(row.revenue) }}</td></tr><tr v-if="!analytics.monthlyRevenue?.length"><td colspan="3" class="empty">No completed orders yet.</td></tr></tbody></table></div></div><div><h3>Top products</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Units</th><th>Sales</th></tr></thead><tbody><tr v-for="row in analytics.topProducts" :key="row.product_id"><td>{{ row.product_name }}</td><td>{{ row.units_sold }}</td><td>R {{ money(row.sales) }}</td></tr><tr v-if="!analytics.topProducts?.length"><td colspan="3" class="empty">No completed sales yet.</td></tr></tbody></table></div></div></div>
        <h3>Stokvel activity</h3><div class="table-wrap"><table><thead><tr><th>Stokvel</th><th>Members</th><th>Orders</th><th>Completed spend</th></tr></thead><tbody><tr v-for="row in analytics.stokvelActivity" :key="row.stokvel_id"><td>{{ row.stokvel_name }}</td><td>{{ row.members }}</td><td>{{ row.orders }}</td><td>R {{ money(row.spend) }}</td></tr></tbody></table></div>
      </section>

      <section v-if="activeTab === 'Activity Log'" class="panel">
        <div class="panel-head"><div><p class="eyebrow">SECURITY</p><h2>Administrator activity</h2><p>Recent changes made through company administration.</p></div><button @click="loadAudit">Refresh</button></div>
        <div class="table-wrap"><table><thead><tr><th>Time</th><th>Administrator</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody><tr v-for="entry in audit" :key="entry.audit_id"><td>{{ formatDateTime(entry.created_at) }}</td><td>{{ entry.admin_name }}<small>{{ entry.admin_email }}</small></td><td><strong>{{ entry.action }}</strong></td><td>{{ entry.entity_type }}{{ entry.entity_id ? ` #${entry.entity_id}` : '' }}</td><td>{{ entry.details || '—' }}</td></tr><tr v-if="!audit.length"><td colspan="5" class="empty">No administrator activity has been recorded yet.</td></tr></tbody></table></div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { getAdminManagedUsers, updateAdminUserRole, getAdminStokvels, getAdminStokvelMembers, setAdminStokvelMemberRole, addAdminStokvelMember, removeAdminStokvelMember, getAdminAnalytics, getAdminAuditLog } from '../services/api.js';

const tabs=['Users','Stokvels','Analytics','Activity Log']; const activeTab=ref('Users'); const users=ref([]); const stokvels=ref([]); const members=ref([]); const selectedStokvel=ref(null); const userSearch=ref(''); const newMemberId=ref(null); const analytics=ref({}); const audit=ref([]); const message=ref('');
const filteredUsers=computed(()=>{const q=userSearch.value.toLowerCase().trim();return users.value.filter(u=>!q||`${u.full_name} ${u.email} ${u.stokvels||''}`.toLowerCase().includes(q));});
const availableMembers=computed(()=>users.value.filter(u=>!u.stokvels));
const notify=t=>{message.value=t;setTimeout(()=>{if(message.value===t)message.value='';},3500)}; const money=v=>Number(v||0).toFixed(2); const formatDate=v=>v?new Date(v).toLocaleDateString():'—'; const formatDateTime=v=>v?new Date(v).toLocaleString():'—';
async function loadUsers(){try{const r=await getAdminManagedUsers();users.value=r.users||[]}catch(e){notify(e.response?.data?.message||'Unable to load users.')}}
async function loadStokvels(){try{const r=await getAdminStokvels();stokvels.value=r.stokvels||[]}catch(e){notify(e.response?.data?.message||'Unable to load Stokvels.')}}
async function saveRole(user){try{const r=await updateAdminUserRole(user.user_id,user.role);Object.assign(user,r.user);notify(`${user.full_name}'s company role was updated.`)}catch(e){await loadUsers();notify(e.response?.data?.message||'Unable to update role.')}}
async function selectStokvel(group){selectedStokvel.value=group;newMemberId.value=null;try{const r=await getAdminStokvelMembers(group.stokvel_id);members.value=r.members||[]}catch(e){notify(e.response?.data?.message||'Unable to load members.')}}
async function saveStokvelRole(member, role){if(!selectedStokvel.value)return;try{await setAdminStokvelMemberRole(selectedStokvel.value.stokvel_id,member.user_id,role);member.stokvel_role=role;await loadStokvels();notify(`${member.full_name}'s Stokvel role was updated.`)}catch(e){await selectStokvel(selectedStokvel.value);notify(e.response?.data?.message||'Unable to update Stokvel role.')}}
async function addMember(){if(!selectedStokvel.value||!newMemberId.value)return;try{await addAdminStokvelMember(selectedStokvel.value.stokvel_id,newMemberId.value);await selectStokvel(selectedStokvel.value);await loadUsers();await loadStokvels();notify('Member added to Stokvel.')}catch(e){notify(e.response?.data?.message||'Unable to add member.')}}
async function removeMember(member){if(!selectedStokvel.value||!confirm(`Remove ${member.full_name} from ${selectedStokvel.value.stokvel_name}?`))return;try{await removeAdminStokvelMember(selectedStokvel.value.stokvel_id,member.user_id);await selectStokvel(selectedStokvel.value);await loadUsers();await loadStokvels();notify('Member removed.')}catch(e){notify(e.response?.data?.message||'Unable to remove member.')}}
async function loadAnalytics(){try{analytics.value=await getAdminAnalytics()}catch(e){notify(e.response?.data?.message||'Unable to load analytics.')}}
async function loadAudit(){try{const r=await getAdminAuditLog();audit.value=r.entries||[]}catch(e){notify(e.response?.data?.message||'Unable to load activity log.')}}
watch(activeTab,(tab)=>{if(tab==='Analytics')loadAnalytics();if(tab==='Activity Log')loadAudit();});
onMounted(async()=>{await Promise.all([loadUsers(),loadStokvels()]);});
</script>

<style scoped>
.management-page{min-height:100vh;background:var(--sw-page-background);color:var(--sw-page-text);padding:38px 16px 64px}.container{max-width:1400px;margin:auto}.page-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:25px}.eyebrow{font-size:var(--sw-text-sm);letter-spacing:.16em;font-weight:800;opacity:.62}.page-head h1{font-size:clamp(2rem,4vw,3.2rem);margin:7px 0;font-family:var(--sw-font-heading)}.page-head p:not(.eyebrow){margin:0;color:var(--sw-page-text-soft)}.back{padding:10px 15px;border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-md);color:var(--sw-page-text);background:var(--sw-page-surface);text-decoration:none}.notice{padding:12px 15px;border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-md);background:var(--sw-page-surface);margin-bottom:16px}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.tabs button{border:1px solid var(--sw-input-border);background:var(--sw-page-surface);color:var(--sw-page-text);padding:10px 15px;border-radius:var(--sw-radius-pill);cursor:pointer}.tabs button.active{background:var(--sw-purple-900);border-color:var(--sw-purple-900);color:#fff}.panel{background:var(--sw-page-surface);border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-lg);padding:22px;box-shadow:var(--sw-card-shadow)}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.panel-head h2{margin:5px 0;font-family:var(--sw-font-heading)}.panel-head p:not(.eyebrow){margin:0;color:var(--sw-page-text-soft)}.panel-head input{min-width:280px}.panel-head input,.panel-head button,.add-member select,.add-member button{padding:10px;border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-sm);background:var(--sw-input-background);color:var(--sw-input-text)}button{cursor:pointer}.panel-head button,.add-member button,td button{background:var(--sw-button-gradient);color:#fff;border-color:transparent;box-shadow:var(--sw-button-shadow)}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:850px}th,td{padding:12px 10px;border-bottom:1px solid var(--sw-input-border);text-align:left;vertical-align:middle}th{font-size:var(--sw-text-sm);letter-spacing:.08em;text-transform:uppercase;opacity:.65}td small,article small{display:block;opacity:.58;margin-top:3px}td select{padding:8px;border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-sm);background:var(--sw-input-background);color:var(--sw-input-text)}td button{padding:8px 12px;border-radius:var(--sw-radius-sm)}.empty{text-align:center;opacity:.6;padding:24px}.stokvel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.stokvel-card{padding:17px;border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-md);cursor:pointer;background:var(--sw-page-background)}.stokvel-card.selected{border-color:var(--sw-purple-900);box-shadow:inset 0 0 0 1px var(--sw-purple-900)}.stokvel-card span,.stokvel-card small{display:block;margin-top:6px;opacity:.65}.member-area{margin-top:22px;border-top:1px solid var(--sw-input-border);padding-top:20px}.member-head{display:flex;justify-content:space-between;gap:15px;align-items:center}.member-head h3{margin:5px 0;font-family:var(--sw-font-heading)}.add-member{display:flex;gap:8px}.member-list article{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:13px 0;border-bottom:1px solid var(--sw-input-border)}.member-list article span{display:block;opacity:.65;font-size:.82rem;margin-top:3px}.member-actions{display:flex;gap:8px;align-items:center}.member-actions select{padding:8px;border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-sm);background:var(--sw-input-background);color:var(--sw-input-text)}.danger{background:transparent!important;color:var(--sw-danger)!important;border:1px solid var(--sw-danger)!important}.metric-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:25px}.metric-grid article{padding:17px;border:1px solid var(--sw-input-border);border-radius:var(--sw-radius-md)}.metric-grid span{font-size:var(--sw-text-sm);opacity:.65}.metric-grid strong{display:block;font-size:1.45rem;margin-top:7px}.analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}.analytics-grid h3{margin-top:0;font-family:var(--sw-font-heading)}@media(max-width:900px){.page-head,.panel-head,.member-head{flex-direction:column}.panel-head input{min-width:0;width:100%}.stokvel-grid,.metric-grid,.analytics-grid{grid-template-columns:1fr}.add-member,.member-actions{width:100%;flex-direction:column}.add-member select{width:100%}.member-actions select,.member-actions button{width:100%}}
</style>
