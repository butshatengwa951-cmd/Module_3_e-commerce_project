<template>
  <div class="member-page" :class="theme">

    <!-- HEADER -->
    <section class="member-header">
      <div>
        <span class="page-label">MEMBER DASHBOARD</span>

        <h1>
          Welcome back.
        </h1>

        <p>
          {{ group.stokvel_name || "Your Stokvel" }}
        </p>
      </div>

      <div class="group-status">
        <span class="status-dot"></span>
        Active group
      </div>
    </section>


    <!-- MAIN CONTENT -->
    <main class="dashboard-content">

      <!-- SAVINGS GOAL -->
      <section class="goal-card">

        <div class="goal-top">

          <div>
            <span class="section-label">
              GROUP SAVINGS
            </span>

            <h2>
              R{{ contributionTotal.toFixed(2) }}
            </h2>
          </div>

          <div class="goal-target">

            <span>
              Goal
            </span>

            <strong>
              R{{ goalAmount.toFixed(2) }}
            </strong>

          </div>

        </div>


        <!-- PROGRESS -->
        <div class="progress-background">

          <div
            class="progress"
            :style="{ width: progress + '%' }"
          ></div>

        </div>


        <div class="goal-bottom">

          <span>
            {{ progress.toFixed(0) }}% complete
          </span>

          <span>
            R{{ remaining.toFixed(2) }} remaining
          </span>

        </div>

      </section>


      <!-- QUICK STATS -->
      <section class="stats-grid">

        <div class="stat-card">

          <span>
            GROUP
          </span>

          <strong>
            {{ group.stokvel_name || "Your Stokvel" }}
          </strong>

          <small>
            Your group
          </small>

        </div>


        <div class="stat-card purple">

          <span>
            MEMBERS
          </span>

          <strong>
            {{ members.length }}
          </strong>

          <small>
            Group members
          </small>

        </div>


        <div class="stat-card brown">

          <span>
            PRODUCTS
          </span>

          <strong>
            {{ productsAvailable }}
          </strong>

          <small>
            Available to shop
          </small>

        </div>

      </section>


      <!-- DASHBOARD GRID -->
      <section class="dashboard-grid">

        <!-- MEMBERS -->
        <div class="panel">

          <div class="panel-header">

            <div>

              <span class="section-label">
                YOUR GROUP
              </span>

              <h2>
                Members
              </h2>

            </div>

            <span class="member-count">
              {{ members.length }} members
            </span>

          </div>


          <!-- REAL MEMBERS -->
          <div
            v-if="members.length"
            class="members-list"
          >

            <div
              v-for="(m, i) in members"
              :key="m.user_id || i"
              class="member-row"
            >

              <div class="avatar">
                {{ getInitials(m) }}
              </div>


              <div class="member-name">

                <strong>
                  {{
                    m.full_name ||
                    m.member_name ||
                    "Member " + (i + 1)
                  }}
                </strong>

                <span>
                  Group member
                </span>

              </div>


              <div class="member-contribution">

                R{{
                  Number(
                    m.contribution_amount ||
                    m.amount ||
                    0
                  ).toFixed(2)
                }}

              </div>

            </div>

          </div>


          <!-- EMPTY STATE -->
          <div
            v-else
            class="empty-members"
          >

            <div class="empty-state">

              <strong>
                No members found
              </strong>

              <p>
                Group members will appear here.
              </p>

            </div>

          </div>

        </div>


        <!-- CONTRIBUTION -->
        <div class="panel contribution-panel">

          <div class="panel-header">

            <span class="section-label">
              GROUP SAVINGS
            </span>

            <h2>
              Add a contribution
            </h2>

          </div>


          <p>
            Add money towards your group's next
            bulk purchase.
          </p>


          <form
            @submit.prevent="submitContribution"
          >

            <label>
              Contribution amount
            </label>


            <div class="amount-input">

              <span>
                R
              </span>

              <input
                v-model.number="contributionAmount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                required
              />

            </div>


            <button
              class="contribute-button"
              type="submit"
            >

              Add Contribution

              <span>
                →
              </span>

            </button>

          </form>


          <div
            v-if="message"
            class="form-message"
          >
            {{ message }}
          </div>


          <div class="secure-message">
            Contributions are recorded for your
            group savings goal.
          </div>

        </div>

      </section>


      <!-- SHOP CTA -->
      <section class="shop-banner">

        <div>

          <span class="section-label">
            READY TO SHOP?
          </span>

          <h2>
            Build your group's basket.
          </h2>

          <p>
            Compare supplier prices and buy
            together to save more.
          </p>

        </div>


        <RouterLink
          to="/catalogue"
          class="shop-button"
        >
          Open Catalogue
          <span>→</span>
        </RouterLink>

      </section>

    </main>

  </div>
</template>


<script setup>

import {
  computed,
  onMounted,
  ref
} from "vue";

import { RouterLink } from "vue-router";

import {
  getMemberDashboard,
  addContribution,
  getProducts
} from "../services/api.js";


defineProps({
  theme: {
    type: String,
    default: "light"
  }
});


/* =========================
   DATA
========================= */

const group = ref({});

const members = ref([]);

const productsAvailable = ref(0);

const contributionTotal = ref(0);

const contributionAmount = ref(0);

const message = ref("");

const goalAmount = ref(1200);


/* =========================
   COMPUTED
========================= */

const progress = computed(() => {

  if (goalAmount.value <= 0) {
    return 0;
  }

  return Math.min(
    (contributionTotal.value /
      goalAmount.value) * 100,
    100
  );

});


const remaining = computed(() => {

  return Math.max(
    goalAmount.value -
      contributionTotal.value,
    0
  );

});


/* =========================
   GET INITIALS
========================= */

function getInitials(member) {

  const name =
    member.full_name ||
    member.member_name ||
    "Member";

  const words = name
    .trim()
    .split(" ")
    .filter(Boolean);


  if (words.length === 0) {
    return "M";
  }


  if (words.length === 1) {

    return words[0]
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();

}


/* =========================
   ADD CONTRIBUTION
========================= */

async function submitContribution() {

  if (
    !contributionAmount.value ||
    contributionAmount.value <= 0
  ) {

    message.value =
      "Please enter a contribution amount.";

    return;

  }


  try {

    await addContribution({

      card_id: 1,

      member_name: "Current member",

      amount:
        contributionAmount.value

    });


    message.value =
      "Contribution added successfully.";


    contributionAmount.value = 0;


    /*
      Reload the dashboard so the contribution
      total comes from the database.
    */

    await loadDashboard();

  } catch (error) {

    console.error(
      "Could not add contribution:",
      error
    );

    message.value =
      "Could not add contribution.";

  }

}


/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

  try {

    const dashboard =
      await getMemberDashboard();


    group.value =
      dashboard.group || {};


    members.value =
      Array.isArray(dashboard.members)
        ? dashboard.members
        : [];


    contributionTotal.value =
      Number(
        dashboard.contributionTotal || 0
      );


    /*
      Load products separately.
    */

    try {

      const products =
        await getProducts();


      productsAvailable.value =
        Array.isArray(products)
          ? products.length
          : 0;

    } catch (error) {

      console.error(
        "Could not load products:",
        error
      );

      productsAvailable.value = 0;

    }

  } catch (error) {

    console.error(
      "Could not load member dashboard:",
      error
    );


    group.value = {};

    members.value = [];

    contributionTotal.value = 0;

    productsAvailable.value = 0;

    message.value =
      "Could not connect to the StockWell backend.";

  }

}


onMounted(loadDashboard);

</script>


<style scoped>

/* =========================
   PAGE
========================= */

.member-page {

  --bg: #EDE7F6;

  --card: #FFFFFF;

  --text: #130E23;

  --muted: #716980;

  --gold: #C8B019;

  --purple: #795D89;

  --brown: #C2583D;

  --line: #DED8E8;

  min-height: 100vh;

  background: var(--bg);

  color: var(--text);

  font-family: "Space Grotesk", sans-serif;

  padding-bottom: 50px;

}


/* =========================
   DARK MODE
========================= */

.member-page.dark {

  --bg: #130E23;

  --card: #211A32;

  --text: #F4EFF8;

  --muted: #AAA1B8;

  --line: rgba(255, 255, 255, 0.1);

}


/* =========================
   HEADER
========================= */

.member-header {

  max-width: 1400px;

  margin: 0 auto;

  padding: 55px 40px 35px;

  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 30px;

}


.page-label {

  display: block;

  font-family: "DM Mono", monospace;

  font-size: 11px;

  letter-spacing: 2px;

  color: var(--purple);

  margin-bottom: 12px;

}


.member-header h1 {

  margin: 0;

  font-size: 44px;

  line-height: 1;

  letter-spacing: -1.5px;

}


.member-header p {

  margin: 12px 0 0;

  color: var(--muted);

  font-size: 14px;

}


.group-status {

  display: flex;

  align-items: center;

  gap: 8px;

  padding: 9px 15px;

  border: 1px solid var(--line);

  border-radius: 30px;

  background: var(--card);

  font-family: "DM Mono", monospace;

  font-size: 11px;

}


.status-dot {

  width: 8px;

  height: 8px;

  border-radius: 50%;

  background: #22c55e;

}


/* =========================
   CONTENT
========================= */

.dashboard-content {

  max-width: 1400px;

  margin: auto;

  padding: 0 40px;

}


/* =========================
   GOAL CARD
========================= */

.goal-card {

  padding: 30px;

  border-radius: 20px;

  background: #1A102E;

  color: white;

  box-shadow:
    0 15px 40px
    rgba(19, 14, 35, 0.18);

}


.goal-top {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 20px;

}


.section-label {

  font-family: "DM Mono", monospace;

  font-size: 10px;

  letter-spacing: 1.5px;

  opacity: 0.7;

}


.goal-top h2 {

  margin: 8px 0 0;

  color: var(--gold);

  font-size: 38px;

  letter-spacing: -1px;

}


.goal-target {

  text-align: right;

  font-family: "DM Mono", monospace;

}


.goal-target span {

  display: block;

  color: rgba(255,255,255,0.55);

  font-size: 10px;

}


.goal-target strong {

  display: block;

  margin-top: 5px;

  color: var(--gold);

  font-size: 20px;

}


.progress-background {

  width: 100%;

  height: 9px;

  margin: 25px 0 10px;

  overflow: hidden;

  border-radius: 20px;

  background: rgba(255,255,255,0.12);

}


.progress {

  height: 100%;

  border-radius: 20px;

  background: var(--gold);

  transition: width 0.5s ease;

}


.goal-bottom {

  display: flex;

  justify-content: space-between;

  color: rgba(255,255,255,0.55);

  font-family: "DM Mono", monospace;

  font-size: 10px;

}


/* =========================
   STATS
========================= */

.stats-grid {

  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 15px;

  margin: 18px 0;

}


.stat-card {

  padding: 22px;

  border-radius: 16px;

  background: var(--card);

  border: 1px solid var(--line);

}


.stat-card.purple {

  background: var(--purple);

  color: white;

  border-color: transparent;

}


.stat-card.brown {

  background: var(--brown);

  color: white;

  border-color: transparent;

}


.stat-card span {

  font-family: "DM Mono", monospace;

  font-size: 10px;

  opacity: 0.65;

}


.stat-card strong {

  display: block;

  margin: 10px 0 5px;

  font-size: 19px;

}


.stat-card small {

  font-size: 11px;

  opacity: 0.65;

}


/* =========================
   DASHBOARD GRID
========================= */

.dashboard-grid {

  display: grid;

  grid-template-columns: 1.25fr 0.75fr;

  gap: 18px;

}


/* =========================
   PANEL
========================= */

.panel {

  padding: 25px;

  border-radius: 18px;

  background: var(--card);

  border: 1px solid var(--line);

}


.panel-header {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  margin-bottom: 20px;

}


.panel-header .section-label {

  color: var(--purple);

  opacity: 1;

}


.panel-header h2 {

  margin: 6px 0 0;

  font-size: 21px;

}


.member-count {

  padding: 6px 10px;

  border-radius: 20px;

  background: var(--bg);

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 9px;

}


/* =========================
   MEMBERS
========================= */

.members-list {

  display: flex;

  flex-direction: column;

}


.member-row {

  display: flex;

  align-items: center;

  gap: 13px;

  padding: 13px 0;

  border-bottom: 1px solid var(--line);

}


.member-row:last-child {

  border-bottom: none;

}


.avatar {

  width: 38px;

  height: 38px;

  flex-shrink: 0;

  display: grid;

  place-items: center;

  border-radius: 50%;

  background: var(--purple);

  color: white;

  font-size: 11px;

  font-weight: 700;

}


.member-name {

  flex: 1;

  display: flex;

  flex-direction: column;

  gap: 3px;

}


.member-name strong {

  font-size: 13px;

}


.member-name span {

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 9px;

}


.member-contribution {

  color: var(--gold);

  font-size: 13px;

  font-weight: 700;

}


/* =========================
   EMPTY MEMBERS
========================= */

.empty-members {

  padding: 20px 0;

}


.empty-state {

  padding: 25px 15px;

  text-align: center;

  border: 1px dashed var(--line);

  border-radius: 12px;

  color: var(--muted);

}


.empty-state strong {

  display: block;

  color: var(--text);

  font-size: 13px;

}


.empty-state p {

  margin: 6px 0 0;

  font-size: 11px;

}


/* =========================
   CONTRIBUTION
========================= */

.contribution-panel p {

  margin: 0 0 20px;

  color: var(--muted);

  font-size: 13px;

  line-height: 1.6;

}


.contribution-panel label {

  display: block;

  margin-bottom: 7px;

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 10px;

}


.amount-input {

  display: flex;

  align-items: center;

  border: 1px solid var(--line);

  border-radius: 12px;

  background: var(--bg);

  padding: 0 14px;

}


.amount-input span {

  font-weight: 700;

}


.amount-input input {

  width: 100%;

  padding: 14px 8px;

  border: none;

  outline: none;

  background: transparent;

  color: var(--text);

  font-family: "Space Grotesk", sans-serif;

  font-size: 16px;

}


.contribute-button {

  width: 100%;

  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-top: 12px;

  padding: 14px 17px;

  border: none;

  border-radius: 12px;

  background: var(--gold);

  color: #130E23;

  font-family: "Space Grotesk", sans-serif;

  font-size: 13px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s ease;

}


.contribute-button:hover {

  transform: translateY(-2px);

}


.form-message {

  margin-top: 12px;

  padding: 10px;

  border-radius: 8px;

  background: rgba(34,197,94,0.1);

  color: #16a34a;

  font-size: 11px;

}


.secure-message {

  margin-top: 20px;

  padding-top: 15px;

  border-top: 1px solid var(--line);

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 9px;

  line-height: 1.5;

}


/* =========================
   SHOP BANNER
========================= */

.shop-banner {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 25px;

  margin-top: 18px;

  padding: 30px;

  border-radius: 18px;

  background: var(--purple);

  color: white;

}


.shop-banner .section-label {

  color: white;

}


.shop-banner h2 {

  margin: 7px 0;

  font-size: 25px;

}


.shop-banner p {

  margin: 0;

  color: rgba(255,255,255,0.7);

  font-size: 12px;

}


.shop-button {

  display: flex;

  align-items: center;

  gap: 15px;

  flex-shrink: 0;

  padding: 13px 20px;

  border: 1px solid white;

  border-radius: 30px;

  color: white;

  text-decoration: none;

  font-size: 12px;

  transition: 0.25s ease;

}


.shop-button:hover {

  background: white;

  color: var(--purple);

}


/* =========================
   MOBILE
========================= */

@media (max-width: 900px) {

  .member-header {

    padding: 35px 20px 25px;

    align-items: flex-start;

    flex-direction: column;

  }


  .member-header h1 {

    font-size: 36px;

  }


  .dashboard-content {

    padding: 0 20px;

  }


  .stats-grid {

    grid-template-columns: 1fr;

  }


  .dashboard-grid {

    grid-template-columns: 1fr;

  }


  .shop-banner {

    align-items: flex-start;

    flex-direction: column;

  }


  .shop-button {

    width: 100%;

    justify-content: space-between;

  }

}


@media (max-width: 550px) {

  .goal-card {

    padding: 22px;

  }


  .goal-top {

    flex-direction: column;

  }


  .goal-target {

    text-align: left;

  }


  .goal-bottom {

    gap: 10px;

    flex-direction: column;

  }


  .member-header h1 {

    font-size: 31px;

  }


  .panel {

    padding: 20px;

  }

}

</style>