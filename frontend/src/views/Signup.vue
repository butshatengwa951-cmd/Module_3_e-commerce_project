<script setup>
import { onMounted, reactive, ref } from "vue";
import { getStokvels, signup } from "../services/api.js";
const stokvels = ref([]);
const loadingStokvels = ref(false);
const submitting = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const form = reactive({
  full_name: "",
  email: "",
  password: "",
  phone_number: "",
  stokvel_name: "",
});
const loadStokvels = async () => {
  loadingStokvels.value = true;
  errorMessage.value = "";
  try {
    const data = await getStokvels();
    if (data.success) {
      stokvels.value = data.stokvels;
    } else {
      errorMessage.value = "Could not load stokvels.";
    }
  } catch (error) {
    console.error("Failed to load stokvels:", error);
    errorMessage.value = "Could not connect to the server.";
  } finally {
    loadingStokvels.value = false;
  }
};
const handleSubmit = async () => {
  successMessage.value = "";
  errorMessage.value = "";
  submitting.value = true;
  try {
    const data = await signup({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      phone_number: form.phone_number,
      stokvel_name: form.stokvel_name,
    });
    if (data.success) {
      successMessage.value = data.message;
      form.full_name = "";
      form.email = "";
      form.password = "";
      form.phone_number = "";
      form.stokvel_name = "";
    } else {
      errorMessage.value = data.message || "Signup failed.";
    }
  } catch (error) {
    console.error("Signup request failed:", error);
    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = "Could not connect to the server.";
    }
  } finally {
    submitting.value = false;
  }
};
onMounted(() => {
  loadStokvels();
});
</script>
<template>
  <main>
    <h1>Create Your StockWell Account</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="full_name">Full Name</label>
        <input id="full_name" v-model="form.full_name" type="text" required />
      </div>
      <div>
        <label for="email">Email</label>
        <input id="email" v-model="form.email" type="email" required />
      </div>
      <div>
        <label for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          minlength="8"
          required
        />
      </div>
      <div>
        <label for="phone_number">Phone Number</label>
        <input id="phone_number" v-model="form.phone_number" type="tel" />
      </div>
      <div>
        <label for="stokvel_name">Choose Your Stokvel</label>
        <select
          id="stokvel_name"
          v-model="form.stokvel_name"
          required
          :disabled="loadingStokvels"
        >
          <option value="" disabled>
            {{ loadingStokvels ? "Loading stokvels..." : "Select a stokvel" }}
          </option>
          <option
            v-for="stokvel in stokvels"
            :key="stokvel.stokvel_id"
            :value="stokvel.stokvel_name"
          >
            {{ stokvel.stokvel_name }}
          </option>
        </select>
      </div>
      <button type="submit" :disabled="submitting || loadingStokvels">
        {{ submitting ? "Creating Account..." : "Sign Up" }}
      </button>
    </form>
    <p v-if="successMessage">{{ successMessage }}</p>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </main>
</template>
