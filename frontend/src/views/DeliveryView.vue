<template>
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
  <div
    style="
      max-width: 1100px;
      margin: 0 auto;
      padding: 48px 24px;
      position: relative;
      z-index: 2;
      font-family: &quot;DM Mono&quot;, monospace;
    "
  >
    <div
      v-if="auth.isLoggedIn"
      style="
        margin-bottom: 12px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 11px;
        color: white;
        font-family: &quot;DM Mono&quot;, monospace;
      "
    >
      👤 {{ auth.fullName }} • {{ auth.email }}
    </div>

    <!-- STATE 1: NO ITEMS / NO TRACKING = EXACT LIKE YOUR 1ST SCREENSHOT -->
    <div
      v-if="!hasReal"
      class="glass"
      style="
        padding: 32px 36px 36px;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.18);
      "
    >
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        "
      >
        <div>
          <div
            style="
              font-size: 11px;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: rgba(30, 27, 58, 0.6);
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            STOCKWELL EXPRESS
          </div>
          <div
            style="
              font-size: 24px;
              font-weight: 500;
              margin-top: 8px;
              color: #1e1b3a;
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            Delivery Tracking
          </div>
          <div style="display: flex; gap: 8px; margin-top: 16px">
            <span
              style="
                padding: 7px 14px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.6);
                border: 1px solid rgba(0, 0, 0, 0.08);
                font-size: 11px;
                color: #1e1b3a;
                font-family: &quot;DM Mono&quot;, monospace;
              "
              >{{ tid }}</span
            ><span
              style="
                padding: 7px 14px;
                border-radius: 999px;
                background: #1e1b3a;
                color: white;
                font-size: 11px;
                font-weight: 500;
                font-family: &quot;DM Mono&quot;, monospace;
              "
              >{{ status }}</span
            >
          </div>
        </div>
        <div style="text-align: right">
          <div
            style="
              font-size: 11px;
              letter-spacing: 0.12em;
              color: rgba(30, 27, 58, 0.5);
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            ETA
          </div>
          <div
            style="
              font-size: 14px;
              font-weight: 500;
              color: #1e1b3a;
              margin-top: 4px;
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            Tomorrow by 18:00
          </div>
        </div>
      </div>
      <div style="margin-top: 28px">
        <div
          style="
            height: 64px;
            border-radius: 18px;
            background: rgba(200, 200, 220, 0.6);
            border: 1px solid rgba(0, 0, 0, 0.06);
            position: relative;
            overflow: hidden;
          "
        >
          <div
            style="
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              border-radius: 18px 0 0 18px;
              background: linear-gradient(90deg, #4a3e72, #c07a4a);
              transition: width.6s;
            "
            :style="{ width: progress + '%' }"
          ></div>
          <div
            style="
              position: absolute;
              left: 16px;
              right: 16px;
              top: 50%;
              border-top: 2px dashed rgba(0, 0, 0, 0.2);
              transform: translateY(-50%);
            "
          ></div>
          <div
            style="
              position: absolute;
              top: 50%;
              transform: translate(-50%, -50%);
              font-size: 20px;
              transition: left.6s;
            "
            :style="{ left: 'calc(8px + ' + progress + '% * 0.88)' }"
          >
            🚚
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="progress"
          style="
            width: 100%;
            margin-top: 16px;
            accent-color: #1e1b3a;
            height: 6px;
          "
        />
      </div>
      <div style="margin-top: 28px">
        <div
          style="
            font-size: 13px;
            font-weight: 500;
            color: #1e1b3a;
            font-family: &quot;DM Mono&quot;, monospace;
          "
        >
          Mock - DB not reachable
        </div>
        <div style="margin-top: 6px">
          <button
            @click="createDemoDelivery"
            style="
              background: #3b5bff;
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-family: &quot;DM Mono&quot;, monospace;
              cursor: pointer;
              text-decoration: underline;
            "
          >
            Connect backend on 4040
          </button>
        </div>
      </div>
    </div>

    <!-- STATE 2: AFTER DEMO / WITH ITEMS = EXACT LIKE YOUR 3RD SCREENSHOT BUT NO SHEIN -->
    <div v-else>
      <div
        class="glass"
        style="
          padding: 28px 28px 24px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(20px);
        "
      >
        <div style="display: flex; justify-content: space-between">
          <div
            style="
              font-size: 11px;
              letter-spacing: 0.12em;
              color: rgba(30, 27, 58, 0.6);
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            STOCKWELL EXPRESS • STOCKWELL GLOBAL
          </div>
          <div style="text-align: right">
            <div
              style="
                font-size: 10px;
                letter-spacing: 0.12em;
                color: rgba(30, 27, 58, 0.6);
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              ESTIMATED DELIVERY
            </div>
            <div
              style="
                font-size: 14px;
                font-weight: 500;
                color: #1e1b3a;
                margin-top: 4px;
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              Tomorrow by 18:00
            </div>
          </div>
        </div>
        <div
          style="
            font-size: 22px;
            font-weight: 500;
            color: #1e1b3a;
            margin-top: 8px;
            font-family: &quot;DM Mono&quot;, monospace;
          "
        >
          Delivery Tracking
        </div>
        <div
          style="
            display: flex;
            gap: 8px;
            margin-top: 6px;
            font-size: 11px;
            color: rgba(30, 27, 58, 0.6);
            font-family: &quot;DM Mono&quot;, monospace;
          "
        >
          StockWell Express ZA • Updated just now
        </div>
        <div style="display: flex; gap: 8px; margin-top: 14px">
          <span
            style="
              padding: 7px 12px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.7);
              border: 1px solid rgba(0, 0, 0, 0.08);
              font-size: 11px;
              font-family: &quot;DM Mono&quot;, monospace;
            "
            >{{ tid }}</span
          ><button
            @click="copyId"
            style="
              padding: 7px 12px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.7);
              border: 1px solid rgba(0, 0, 0, 0.08);
              font-size: 11px;
              cursor: pointer;
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            COPY</button
          ><span
            style="
              padding: 7px 12px;
              border-radius: 999px;
              background: #1e1b3a;
              color: white;
              font-size: 11px;
              font-weight: 500;
              font-family: &quot;DM Mono&quot;, monospace;
            "
            >{{ status }}</span
          >
        </div>
        <div
          style="
            margin-top: 22px;
            height: 64px;
            border-radius: 18px;
            background: rgba(220, 220, 230, 0.8);
            border: 1px solid rgba(0, 0, 0, 0.06);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
          "
        >
          <div
            style="
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              border-radius: 18px 0 0 18px;
              background: linear-gradient(
                90deg,
                #4a3e72,
                #a05a5a 50%,
                #c67a3a 100%
              );
              transition: width.6s;
            "
            :style="{ width: progress + '%' }"
          ></div>
          <div
            style="
              position: absolute;
              left: 12px;
              top: 50%;
              transform: translateY(-50%);
              padding: 6px 10px;
              border-radius: 999px;
              background: white;
              border: 1px solid rgba(0, 0, 0, 0.08);
              font-size: 11px;
              font-weight: 500;
            "
          >
            CT
          </div>
          <div
            style="
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              padding: 6px 10px;
              border-radius: 999px;
              background: #111;
              color: white;
              font-size: 11px;
              font-weight: 500;
            "
          >
            YOU
          </div>
          <div
            style="
              position: absolute;
              left: 48px;
              right: 48px;
              top: 50%;
              border-top: 2px dashed rgba(0, 0, 0, 0.25);
              transform: translateY(-50%);
            "
          ></div>
          <div
            style="
              position: absolute;
              top: 50%;
              transform: translate(-50%, -50%);
              font-size: 20px;
              transition: left.6s;
            "
            :style="{ left: 'calc(48px + ' + progress + '% * 0.72)' }"
          >
            🚚
          </div>
        </div>
        <div
          style="
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-top: 18px;
            text-align: center;
          "
        >
          <div v-for="(s, i) in steps" :key="s.label">
            <div
              :style="
                i <= currentStep
                  ? 'width:32px; height:32px; border-radius:999px; background:#1e1b3a; color:white; display:grid; place-items:center; margin:0 auto; font-size:12px'
                  : 'width:32px; height:32px; border-radius:999px; background:rgba(0,0,0,0.08); color:rgba(0,0,0,0.4); display:grid; place-items:center; margin:0 auto'
              "
            >
              {{ i <= currentStep ? "✓" : "○" }}
            </div>
            <div
              style="
                font-size: 10px;
                font-weight: 500;
                margin-top: 8px;
                color: #1e1b3a;
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              {{ s.label }}
            </div>
            <div
              style="
                font-size: 9px;
                color: rgba(0, 0, 0, 0.5);
                margin-top: 2px;
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              {{ s.date }}
            </div>
          </div>
        </div>
      </div>

      <div
        style="
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 20px;
          margin-top: 20px;
        "
      >
        <div
          class="glass"
          style="
            padding: 22px 24px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.12);
          "
        >
          <div style="display: flex; justify-content: space-between">
            <div
              style="
                font-size: 11px;
                letter-spacing: 0.12em;
                color: #1e1b3a;
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              LOGISTICS TIMELINE
            </div>
            <button
              @click="simulateNext"
              style="
                padding: 8px 14px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.7);
                border: 1px solid rgba(0, 0, 0, 0.08);
                font-size: 11px;
                cursor: pointer;
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              SIMULATE NEXT →
            </button>
          </div>
          <div style="margin-top: 20px">
            <div
              v-for="l in timeline"
              :key="l.title"
              style="
                display: flex;
                gap: 12px;
                padding: 14px 0;
                border-left: 1px solid rgba(0, 0, 0, 0.08);
                margin-left: 8px;
                padding-left: 20px;
                position: relative;
              "
            >
              <div
                style="
                  position: absolute;
                  left: -6px;
                  top: 16px;
                  width: 12px;
                  height: 12px;
                  border-radius: 999px;
                  background: white;
                  border: 2px solid #1e1b3a;
                "
              ></div>
              <div style="flex: 1">
                <div
                  style="
                    font-size: 13px;
                    font-weight: 500;
                    color: #1e1b3a;
                    display: flex;
                    justify-content: space-between;
                    font-family: &quot;DM Mono&quot;, monospace;
                  "
                >
                  <span>{{ l.title }}</span
                  ><span style="font-size: 11px; color: rgba(0, 0, 0, 0.5)">{{
                    l.time
                  }}</span>
                </div>
                <div
                  style="
                    font-size: 11px;
                    color: rgba(0, 0, 0, 0.6);
                    margin-top: 4px;
                    font-family: &quot;DM Mono&quot;, monospace;
                  "
                >
                  {{ l.desc }}
                </div>
                <div
                  v-if="l.tag"
                  style="
                    margin-top: 8px;
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    font-size: 10px;
                    font-family: &quot;DM Mono&quot;, monospace;
                  "
                >
                  {{ l.tag }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="glass"
          style="
            padding: 22px 24px;
            border-radius: 24px;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.18),
              rgba(255, 180, 150, 0.25)
            );
            height: fit-content;
          "
        >
          <div
            style="
              font-size: 11px;
              letter-spacing: 0.12em;
              color: #1e1b3a;
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            DELIVERY ADDRESS
          </div>
          <div
            style="
              font-size: 13px;
              font-weight: 500;
              color: #1e1b3a;
              margin-top: 12px;
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            N. Dlamini • +27 82 123 4567
          </div>
          <div
            style="
              font-size: 11px;
              color: rgba(0, 0, 0, 0.6);
              margin-top: 8px;
              line-height: 1.6;
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            12 Loop Street, Cape Town, 8001, South Africa. Gate code: 4321.
            Leave at security if not home.
          </div>
          <div
            style="
              margin-top: 16px;
              padding: 14px;
              border-radius: 14px;
              background: rgba(255, 255, 255, 0.6);
              border: 1px dashed rgba(0, 0, 0, 0.12);
            "
          >
            <div
              style="
                font-size: 11px;
                font-weight: 500;
                color: #1e1b3a;
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              TIP
            </div>
            <div
              style="
                font-size: 11px;
                color: rgba(0, 0, 0, 0.6);
                margin-top: 6px;
                line-height: 1.5;
                font-family: &quot;DM Mono&quot;, monospace;
              "
            >
              Truck moves based on progress %. Change progress slider to see
              animation.
            </div>
          </div>
          <div
            style="
              margin-top: 16px;
              font-size: 11px;
              color: #1e1b3a;
              font-family: &quot;DM Mono&quot;, monospace;
            "
          >
            PROGRESS {{ progress }}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="progress"
            @change="updateProgress"
            style="width: 100%; margin-top: 8px"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api.js";
import { useAuthStore } from "../stores/auth.js";
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const tid = ref(route.params.id || "SW-DEMO-ZA");
const progress = ref(38);
const status = ref("SHIPPED");
const timeline = ref([]);
const hasReal = ref(!!route.params.id && route.params.id !== "SW-DEMO-ZA");
const steps = ref([
  { label: "ORDERED", date: "08 Sep 09:12" },
  { label: "PAID", date: "08 Sep 09:13" },
  { label: "SHIPPED", date: "08 Sep 14:30" },
  { label: "IN TRANSIT", date: "09 Sep 08:00" },
  { label: "OUT FOR DELIVERY", date: "-" },
  { label: "DELIVERED", date: "-" },
]);
const currentStep = computed(() =>
  progress.value < 20
    ? 0
    : progress.value < 40
      ? 1
      : progress.value < 70
        ? 2
        : progress.value < 85
          ? 3
          : progress.value < 95
            ? 4
            : 5,
);
function copyId() {
  navigator.clipboard.writeText(tid.value);
}
async function fetchD() {
  if (!route.params.id || route.params.id === "SW-DEMO-ZA") {
    hasReal.value = false;
    return;
  }
  try {
    const { data } = await api.get("/delivery/" + tid.value);
    progress.value = data.progress;
    status.value = (data.status || "").toUpperCase();
    timeline.value = (data.timeline_raw || []).map((l) => ({
      title: l.title,
      desc: l.desc,
      time: l.date || "",
      tag: l.tag,
    }));
    hasReal.value = true;
    tid.value = data.tracking_number;
  } catch {
    hasReal.value = false;
  }
}
async function updateProgress() {
  if (hasReal.value)
    await api.patch("/delivery/" + tid.value + "/progress", {
      progress: progress.value,
    });
}
function simulateNext() {
  progress.value = Math.min(100, progress.value + 20);
  updateProgress();
}
async function createDemoDelivery() {
  const email = auth.email || "guest@stockwell.global";
  const prods = await api.get("/products");
  const p = prods.data[0];
  await api.post("/cart", {
    email,
    user_id: auth.userId,
    product_id: p.id || p.product_id,
    price: p.price,
    qty: 1,
  });
  const cart = await api.get(
    "/cart?email=" + email + (auth.userId ? "&user_id=" + auth.userId : ""),
  );
  const { data } = await api.post("/pay", {
    email,
    user_id: auth.userId,
    member_name: auth.fullName || "N. Dlamini",
    total: cart.data.reduce((a, b) => a + Number(b.price) * (b.qty || 1), 0),
    items: cart.data.map((i) => ({
      product_id: i.product_id,
      name: i.product_name,
      price: i.price,
      qty: i.qty,
    })),
    address: "12 Loop Street, Cape Town",
  });
  router.push("/delivery/" + data.tracking_number);
}
onMounted(() => {
  auth.syncFromStorage();
  fetchD();
});
</script>
