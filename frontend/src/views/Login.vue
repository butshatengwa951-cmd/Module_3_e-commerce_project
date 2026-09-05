<script setup>
import { ref } from "vue";
import { login } from "../services/api.js";

const email = ref("");
const password = ref("");

const message = ref("");
const error = ref("");

const loading = ref(false);
const handleLogin = async () => {
  message.value = "";
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Email and password are required.";
    return;
  }

  loading.value = true;

  try {
    const response = await login({
      email: email.value,
      password: password.value,
    });

    if (response.success) {
      message.value = response.message;

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("stokvel", JSON.stringify(response.stokvel));

      console.log("Logged in user:", response.user);
      console.log("User Stokvel:", response.stokvel);
    } else {
      error.value = response.message;
    }
  } catch (err) {
    console.error("Login error:", err);

    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = "Unable to connect to the server.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Enter your password"
          required
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? "Logging in..." : "Login" }}
      </button>
    </form>
    <p v-if="message" class="success-message">{{ message }}</p>
    <p v-if="error" class="error-message">{{ error }}</p>
    <router-link to="/signup"> Don't have an account? Sign up </router-link>
  </div>
</template>
